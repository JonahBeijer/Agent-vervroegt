import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ROOT, configuration } from '../les-5/config.js';
export function createApp({ store, service, library } = {}) {
    const app = express(), busy = new Set(), rates = new Map(), jobs = new Map();
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1, fields: 0 } });
    app.disable('x-powered-by');
    app.use((req,res,next) => {
        res.setHeader('X-Content-Type-Options','nosniff');
        res.setHeader('Referrer-Policy','same-origin');
        res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'");
        if (req.path.startsWith('/api/')) res.setHeader('Cache-Control','no-store');
        if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
            const origin = req.get('origin');
            if (origin && origin !== req.protocol + '://' + req.get('host')) return res.status(403).json({ error: 'Aanvraag vanaf een andere website geweigerd.' });
            if (req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ error: 'Aanvraag vanaf een andere website geweigerd.' });
        }
        next();
    });
    app.use('/api', express.json({ limit: '24kb' }));
    app.use('/api', (req,res,next) => {
        const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith('study_session='))?.slice(14);
        req.session = store.session(cookie && /^[A-Za-z0-9_-]{43}$/.test(cookie) ? cookie : null);
        if (req.session.rawToken) res.setHeader('Set-Cookie','study_session=' + req.session.rawToken + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=31536000' + (req.secure ? '; Secure' : ''));
        next();
    });
    const snapshot = session => ({ thread: session.active, threads: store.threads(session.owner), turns: store.turns(session.active), documents: library?.list(session.owner) || [], status: configuration(), maxTurns: 12 });
    const idle = (req,res,next) => busy.has(req.session.owner) ? res.status(409).json({ error: 'Wacht tot de huidige aanvraag klaar is.' }) : next();
    app.get('/api/session', (req,res) => res.json(snapshot(req.session)));
    app.post('/api/session', idle, (req,res) => {
        if (req.body.thread) {
            if (typeof req.body.thread !== 'string' || !store.select(req.session,req.body.thread)) return res.status(404).json({error:'Gesprek niet gevonden.'});
        } else store.newThread(req.session);
        res.json(snapshot(req.session));
    });
    app.post('/api/chat', idle, async (req,res) => {
        const prompt = req.body.prompt;
        if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) return res.status(400).json({ error: 'Gebruik een vraag van 1 tot 4.000 tekens.' });
        if (store.turns(req.session.active).length >= 12) return res.status(409).json({ error: 'Dit gesprek heeft 12 rondes. Start een nieuw gesprek om de modelcontext te begrenzen.' });
        const current = rates.get(req.session.owner) || [];
        const recent = current.filter(time => time > Date.now() - 60_000);
        if (recent.length >= 6) return res.status(429).json({ error: 'Maximaal zes vragen per minuut. Probeer straks opnieuw.' });
        recent.push(Date.now()); rates.set(req.session.owner,recent);
        if (rates.size > 1000) for(const [key,times] of rates) if(times.at(-1) < Date.now()-60_000) rates.delete(key);
        busy.add(req.session.owner);
        const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 90_000);
        const abort = () => { if(!res.writableEnded) controller.abort(); };
        res.on('close',abort);
        res.setHeader('Content-Type','application/x-ndjson; charset=utf-8'); res.flushHeaders();
        const emit = event => { if (!res.destroyed && !res.writableEnded) res.write(JSON.stringify(event) + '\n'); };
        try { const result = await service.chat(req.session,prompt.trim(),emit,controller.signal); emit({ type:'done', ...result, state:snapshot(req.session) }); }
        catch(error) { console.error('[agent]', error.code || 'ERROR'); emit({type:'error',error:error.message,code:error.code,tokens:error.tokens,tools:error.tools}); }
        finally {clearTimeout(timer);busy.delete(req.session.owner);res.off('close',abort);res.end();}
    });
    app.get('/api/documents', (req,res) => res.json(library?.list(req.session.owner) || []));
    app.post('/api/documents', idle, upload.single('file'), async (req,res,next) => {
        if (!library) return res.status(503).json({error:'Documenten zijn nog niet ingesteld.'});
        if (!req.file) return res.status(400).json({error:'Selecteer één PDF-, TXT- of Markdown-bestand.'});
        const owner = req.session.owner;
        const id = randomUUID(), job = {id,owner,status:'running',phase:'Document lezen',progress:0};
        if (jobs.size > 100) for (const [key,value] of jobs) if(value.status !== 'running') jobs.delete(key);
        jobs.set(id,job); busy.add(owner);
        res.status(202).json({job:id});
        try {
            await library.add({ owner, name:req.file.originalname, bytes:req.file.buffer }, (phase,progress) => Object.assign(job,{phase,progress}));
            Object.assign(job,{status:'done',phase:'Document doorzoekbaar',progress:100});
        } catch(error) { Object.assign(job,{status:'error',error:error.publicMessage || 'Document verwerken is mislukt. Controleer of het tekst bevat en probeer opnieuw.'}); }
        finally{busy.delete(owner);}
    });
    app.get('/api/jobs/:id', (req,res) => {
        const job = jobs.get(req.params.id);
        if (!job || job.owner !== req.session.owner) return res.status(404).json({error:'Import niet gevonden.'});
        const {owner,...safe}=job;res.json(safe);
    });
    app.delete('/api/documents/:id',idle,(req,res) => {
        if(!library?.remove(req.params.id,req.session.owner)) return res.status(404).json({error:'Document niet gevonden of behoort tot het lesmateriaal.'});
        res.json({ok:true});
    });
    app.get('/api/documents/:id/download',(req,res) => {
        const doc=library?.file(req.params.id,req.session.owner);
        if(!doc)return res.status(404).json({error:'Document niet gevonden.'});
        res.download(doc.path,doc.name);
    });
    app.get('/api/export',(req,res)=>res.json(snapshot(req.session)));
    app.use('/vendor',express.static(path.join(ROOT,'node_modules/dompurify/dist'),{dotfiles:'deny'}));
    app.use(express.static(path.join(ROOT,'les-6/public'),{dotfiles:'deny'}));
    app.use((error,req,res,next) => {if(res.headersSent)return next(error);res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : error instanceof multer.MulterError || error.type === 'entity.parse.failed' ? 400 : 500).json({error:error.code === 'LIMIT_FILE_SIZE' ? 'Bestand is groter dan 12 MB.' : 'Aanvraag kon niet worden verwerkt.'});});
    return app;
}
