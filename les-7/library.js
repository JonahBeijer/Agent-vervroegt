import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import { convert } from 'html-to-text';
import { LocalEmbeddings } from './embeddings.js';
export function chunksOf(text, size = 950, overlap = 130) {
    const clean = text.replaceAll('\u0000','').replace(/\r/g,'').trim();
    const chunks = [];
    for(let start=0;start<clean.length;) {
        let end=Math.min(clean.length,start+size);
        if(end<clean.length){const boundary=clean.lastIndexOf(' ',end);if(boundary>start+size/2)end=boundary;}
        const content=clean.slice(start,end).trim();if(content.length>=25)chunks.push(content);
        if(end>=clean.length)break;start=Math.max(start+1,end-overlap);
    }
    return chunks;
}
export function cosine(a,b) {
    if(a.length!==b.length || !a.length)return 0;
    let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i];}
    return aa && bb ? dot/Math.sqrt(aa*bb) : 0;
}
const userError = message => Object.assign(new Error(message), { publicMessage: message });
export async function extract(name, bytes) {
    const extension=path.extname(name).toLowerCase();
    if(extension==='.pdf'){
        const parser=new PDFParse({data:new Uint8Array(bytes)});
        try {const result=await parser.getText();return {pdfPages:result.total,pages:result.pages.map(page=>({page:page.num,text:page.text}))};}
        finally{await parser.destroy();}
    }
    if(!['.txt','.md','.html'].includes(extension))throw userError('Gebruik PDF, TXT of Markdown.');
    const text=extension==='.html'?convert(bytes.toString('utf8'),{wordwrap:false,selectors:[{selector:'img',format:'skip'},{selector:'a',options:{ignoreHref:true}}]}):bytes.toString('utf8');
    return {pdfPages:0,pages:text.split(/\f|(?=^#{1,2} )/m).filter(value=>value.trim()).map((text,i)=>({section:i+1,text}))};
}
export class Library {
    constructor(store,{embeddings=new LocalEmbeddings()}={}) {
        this.store=store;this.db=store.db;this.embeddings=embeddings;this.queue=Promise.resolve();
        this.directory=path.join(store.directory,'documents');mkdirSync(this.directory,{recursive:true});
        this.db.exec('CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,owner TEXT NOT NULL,name TEXT NOT NULL,hash TEXT NOT NULL,pdfPages INTEGER NOT NULL,sections INTEGER NOT NULL,created INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS chunks(id TEXT PRIMARY KEY,doc TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,page INTEGER,section INTEGER,text TEXT NOT NULL,vector TEXT NOT NULL); CREATE INDEX IF NOT EXISTS chunks_document ON chunks(doc);');
    }
    list(owner) {
        return this.db.prepare("SELECT d.id,d.name,d.owner,d.pdfPages,d.sections,d.created,count(c.id) as chunks FROM documents d LEFT JOIN chunks c ON c.doc=d.id WHERE d.owner='shared' OR d.owner=? GROUP BY d.id ORDER BY d.created").all(owner).map(({owner:ownerId,...doc})=>({...doc,shared:ownerId==='shared'}));
    }
    add(input,progress=()=>{}) {
        progress('Wachten op documentverwerking',0);
        const job=this.queue.then(()=>this.ingest(input,progress));
        this.queue=job.catch(()=>{});
        return job;
    }
    async ingest({owner,name,bytes},progress) {
        name=path.basename(name.replaceAll(chrBackslash(),'/')).slice(0,180);
        if(bytes.length>32*1024*1024)throw userError('Bestand is groter dan 32 MB.');
        if(this.list(owner).filter(doc=>!doc.shared).length>=20 && owner!=='shared')throw userError('Maximaal twintig eigen documenten per browserprofiel.');
        const hash=createHash('sha256').update(bytes).digest('hex');
        const existing=this.db.prepare('SELECT id FROM documents WHERE owner=? AND hash=? AND name=?').get(owner,hash,name);
        if(existing)return existing.id;
        progress('Tekst en pagina’s lezen',5);
        const extracted=await extract(name,bytes);
        const chunks=extracted.pages.flatMap(page=>chunksOf(page.text).map(text=>({text,page:page.page||null,section:page.section||null})));
        if(!chunks.length)throw userError('Geen doorzoekbare tekst gevonden. Een gescande PDF heeft eerst OCR nodig.');
        if(chunks.length>600 || extracted.pdfPages>250)throw userError('Document is te groot. Splits het in kleinere bestanden.');
        progress('Lokaal embeddingmodel laden',10);
        if(this.embeddings.model)await this.embeddings.model();
        progress('Tekst omzetten naar zoekvectoren',15);
        const vectors=await this.embeddings.embedDocuments(chunks.map(chunk=>chunk.text),(done,total)=>progress('Tekst omzetten naar zoekvectoren',15+Math.round(done/total*80)));
        if(vectors.length!==chunks.length || vectors.some(vector=>!vector.length || !vector.every(Number.isFinite)))throw userError('Embeddingmodel gaf ongeldige vectoren.');
        const id=randomUUID(),file=path.join(this.directory,id);
        writeFileSync(file,bytes);
        this.db.exec('BEGIN');
        try{
            this.db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?,?)').run(id,owner,name,hash,extracted.pdfPages,extracted.pages.length,Date.now());
            const insert=this.db.prepare('INSERT INTO chunks VALUES(?,?,?,?,?,?)');
            for(let i=0;i<chunks.length;i++)insert.run(id+':'+i,id,chunks[i].page,chunks[i].section,chunks[i].text,JSON.stringify(vectors[i]));
            this.db.exec('COMMIT');
        }catch(error){this.db.exec('ROLLBACK');unlinkSync(file);throw error;}
        progress('Document doorzoekbaar',100);return id;
    }
    async search(query,owner,limit=4,lesson=null) {
        const vector=await this.embeddings.embedQuery(query);
        const rows=this.db.prepare("SELECT c.*,d.name,d.owner FROM chunks c JOIN documents d ON d.id=c.doc WHERE d.owner='shared' OR d.owner=?").all(owner);
        return rows.filter(row=>!lesson || row.name.startsWith('Les '+lesson+' - ')).map(row=>({...row,score:cosine(vector,JSON.parse(row.vector))})).filter(row=>row.score>=0.65).sort((a,b)=>b.score-a.score).slice(0,limit).map(({vector,owner,...row})=>row);
    }
    file(id,owner) {
        const row=this.db.prepare("SELECT id,name FROM documents WHERE id=? AND (owner='shared' OR owner=?)").get(id,owner);
        return row?{name:row.name,path:path.join(this.directory,row.id)}:null;
    }
    remove(id,owner) {
        const doc=this.db.prepare("SELECT id FROM documents WHERE id=? AND owner=? AND owner!='shared'").get(id,owner);
        if(!doc)return false;
        this.db.prepare('DELETE FROM documents WHERE id=?').run(id);try{unlinkSync(path.join(this.directory,id));}catch{}return true;
    }
}
function chrBackslash(){return String.fromCharCode(92);}
