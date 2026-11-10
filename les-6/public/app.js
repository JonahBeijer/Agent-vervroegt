import { micromark } from './vendor/micromark.js';
import DOMPurify from '/vendor/purify.es.mjs';
const $ = id => document.getElementById(id);
let state, busy = false, controller;
const toolLabels = { search_documents:'Lesmateriaal doorzoeken', current_date:'Datum controleren', make_study_plan:'Studietijd verdelen', technology_news:'Praktijkvoorbeeld zoeken' };
function notice(text) { $('notice').textContent=text;$('notice').classList.remove('hidden');setTimeout(()=>$('notice').classList.add('hidden'),6500); }
async function api(path, options={}) { const response=await fetch('/api/'+path,options);const data=await response.json();if(!response.ok)throw new Error(data.error||'Aanvraag mislukt.');return data; }
const post=(path,body={})=>api(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function lock(value) { busy=value;for(const el of document.querySelectorAll('button,textarea,input'))if(el.id!=='stop')el.disabled=value;$('stop').classList.toggle('hidden',!value); }
function markdown(text){return DOMPurify.sanitize(micromark(text,{allowDangerousHtml:false,allowDangerousProtocol:false}));}
function bubble(role,text,detail={}) {
    $('welcome')?.remove();
    const card=document.createElement('article');card.className='message '+role;
    const name=document.createElement('span');name.className='message-label';name.textContent=role==='user'?'JIJ':'✳  STUDIEKOMPAS';card.append(name);
    const content=document.createElement('div');
    if(role==='assistant'){content.innerHTML=markdown(text);for(const a of content.querySelectorAll('a')){a.target='_blank';a.rel='noopener noreferrer';}}
    else content.textContent=text;
    card.append(content);
    if(detail.tokens){const label=document.createElement('small');label.className='token-label';label.textContent=detail.tokens.total.toLocaleString('nl-NL')+' tokens · '+detail.tokens.input+' input / '+detail.tokens.output+' output';card.append(label);}
    $('messages').append(card);card.scrollIntoView({block:'nearest',behavior:'smooth'});return card;
}
function renderSources(sources=[]) {
    $('sources').replaceChildren();$('source-count').textContent=sources.length;
    if(!sources.length){const p=document.createElement('p');p.className='empty-note';p.textContent='Nog geen bronnen geraadpleegd.';$('sources').append(p);}
    for(const source of sources){
        const card=document.createElement('div');card.className='source';
        const link=document.createElement('a');link.textContent=source.title;
        if(source.kind==='document')link.href='/api/documents/'+encodeURIComponent(source.documentId)+'/download';
        else {try{if(['http:','https:'].includes(new URL(source.url).protocol)){link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';}}catch{}}
        const meta=document.createElement('small');meta.textContent=source.kind==='document'?(source.page?'Pagina '+source.page:'Sectie '+source.section):source.publisher+' · '+source.date;
        card.append(link,meta);if(source.excerpt){const p=document.createElement('p');p.textContent=source.excerpt;card.append(p);}$('sources').append(card);
    }
}
function renderTools(events=[]) {
    $('tool-trace').replaceChildren();
    if(!events.length){const p=document.createElement('p');p.className='empty-note';p.textContent='Voor dit antwoord waren geen tools nodig.';$('tool-trace').append(p);}
    for(const event of events){
        const row=document.createElement('div');row.className='trace-event '+event.status;
        const title=document.createElement('strong');title.textContent=(event.status==='done'?'✓ ':event.status==='error'?'! ':'◌ ')+(toolLabels[event.name]||event.name);
        const text=document.createElement('span');text.textContent=event.status==='running'?'Bezig…':(event.summary||'Uitgevoerd')+(event.durationMs!==undefined?' · '+(event.durationMs/1000).toFixed(1)+' s':'');row.append(title,text);$('tool-trace').append(row);
    }
}
function renderDocuments(documents=[]) {
    $('documents').replaceChildren();$('document-count').textContent=documents.length;
    const pages=documents.reduce((sum,doc)=>sum+(doc.pdfPages||0),0);
    $('document-summary').textContent=documents.length+(documents.length===1?' document':' documenten')+' · '+pages+' PDF-pagina’s';
    if(!documents.length){const p=document.createElement('p');p.className='empty-note';p.textContent='Nog geen documenten. Importeer het lesmateriaal met npm run import:course.';$('documents').append(p);}
    for(const doc of documents){
        const row=document.createElement('div');row.className='document';
        const link=document.createElement('a');link.href='/api/documents/'+encodeURIComponent(doc.id)+'/download';link.textContent=doc.name;
        const info=document.createElement('small');info.textContent=(doc.pdfPages?doc.pdfPages+(doc.pdfPages===1?' pagina':' pagina’s'):doc.sections+(doc.sections===1?' sectie':' secties'))+' · '+doc.chunks+(doc.chunks===1?' fragment':' fragmenten');
        row.append(link,info);$('documents').append(row);
    }
}
function apply(next) {
    state=next;$('threads').replaceChildren();
    for(const thread of state.threads){const button=document.createElement('button');button.textContent=thread.title;button.classList.toggle('active',thread.id===state.thread);button.addEventListener('click',()=>selectThread(thread.id));$('threads').append(button);}
    renderDocuments(state.documents);
}
async function selectThread(thread){if(busy)return;lock(true);try{const next=await post('session',thread?{thread}:{});apply(next);$('messages').replaceChildren();for(const turn of next.turns){bubble('user',turn.prompt);bubble('assistant',turn.answer,turn.detail);}const last=next.turns.at(-1)?.detail;renderSources(last?.sources);renderTools(last?.tools);if(!next.turns.length){const p=document.createElement('p');p.className='empty-note';p.textContent='Nieuw gesprek. Stel een vraag over lessen 5 t/m 8.';$('messages').append(p);}}catch(error){notice(error.message);}finally{lock(false);}}
async function submit(prompt) {
    if(busy||!state||!prompt.trim())return;
    lock(true);controller=new AbortController();bubble('user',prompt);$('prompt').value='';$('activity').textContent='Je vraag wordt gelezen…';renderSources([]);const events=[];
    let completed=false;
    try {
        const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt}),signal:controller.signal});
        if(!response.ok){const data=await response.json();throw new Error(data.error);}
        const reader=response.body.getReader(),decoder=new TextDecoder();let pending='';
        const event=line=>{
            if(!line.trim())return;const data=JSON.parse(line);
            if(data.type==='tool'){const i=events.findIndex(event=>event.id===data.event.id);if(i<0)events.push(data.event);else events[i]=data.event;renderTools(events);$('activity').textContent=toolLabels[data.event.name]||'Tool uitvoeren…';}
            if(data.type==='done'){completed=true;bubble('assistant',data.answer,data);renderSources(data.sources);renderTools(data.tools);apply(data.state);}
            if(data.type==='error'){completed=true;const card=bubble('assistant',data.error,{tokens:data.tokens});card.classList.add('error');renderTools(data.tools);}
        };
        while(true){const {value,done}=await reader.read();if(done)break;pending+=decoder.decode(value,{stream:true});const lines=pending.split('\n');pending=lines.pop();for(const line of lines)event(line);}if(pending.trim())event(pending);
        if(!completed)throw new Error('De verbinding stopte voordat het antwoord af was.');
    }catch(error){const card=bubble('assistant',error.name==='AbortError'?'Aanvraag gestopt.':error.message);card.classList.add('error');}
    finally{$('activity').textContent='';lock(false);$('prompt').focus();}
}
$('chat-form').addEventListener('submit',event=>{event.preventDefault();submit($('prompt').value.trim());});
$('prompt').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();$('chat-form').requestSubmit();}});
$('prompt').addEventListener('input',()=>{$('char-count').textContent=$('prompt').value.length?'Vraag: '+$('prompt').value.length+' / 4.000 tekens':'Enter om te versturen · Shift + Enter voor een nieuwe regel';});
for(const button of document.querySelectorAll('[data-prompt]'))button.addEventListener('click',()=>submit(button.dataset.prompt));
$('new-chat').addEventListener('click',()=>selectThread());
$('stop').addEventListener('click',()=>controller?.abort());
try{const initial=await api('session');apply(initial);if(initial.turns.length){$('messages').replaceChildren();for(const turn of initial.turns){bubble('user',turn.prompt);bubble('assistant',turn.answer,turn.detail);}renderSources(initial.turns.at(-1).detail.sources);renderTools(initial.turns.at(-1).detail.tools);}}catch(error){notice('Server niet bereikbaar. '+error.message);}
