import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Store } from '../les-6/store.js';
import { createApp } from '../les-6/server.js';
import { Library } from '../les-7/library.js';
async function serverTest(action, serviceFactory) {
    const dir=mkdtempSync(path.join(tmpdir(),'agent-server-')),store=new Store(dir);
    const service=serviceFactory?.(store)||{chat:async(session,prompt,emit)=>{
        emit({type:'tool',event:{id:'TEST',name:'current_date',status:'done'}});
        const answer='FICTIEF TESTANTWOORD';const detail={tokens:{input:1,output:2,total:3},sources:[],tools:[]};
        store.saveTurn(session,prompt,answer,detail);return{answer,...detail};
    }};
    const server=createApp({store,service}).listen(0,'127.0.0.1');await once(server,'listening');
    const base='http://127.0.0.1:'+server.address().port;
    try{await action(base,store);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.close();rmSync(dir,{recursive:true,force:true});}
}
async function session(base){const res=await fetch(base+'/api/session');return{cookie:res.headers.get('set-cookie').split(';')[0],state:await res.json()};}
const post=(base,cookie,body,path='/api/chat')=>fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',cookie},body:JSON.stringify(body)});
test('chatprotocol heeft echte events en geschiedenis is gescheiden per cookie',()=>serverTest(async base=>{
    const a=await session(base),b=await session(base);
    const response=await post(base,a.cookie,{prompt:'TEST vraag'});
    const events=(await response.text()).trim().split('\n').map(JSON.parse);
    assert.equal(events[0].type,'tool');assert.equal(events.at(-1).type,'done');
    assert.equal(events.at(-1).state.turns.length,1);
    const other=await(await fetch(base+'/api/session',{headers:{cookie:b.cookie}})).json();assert.equal(other.turns.length,0);
    assert.equal((await post(base,b.cookie,{thread:a.state.thread},'/api/session')).status,404);
    assert.equal((await fetch(base+'/les-5/config.js')).status,404);
    assert.equal((await fetch(base+'/.env.example')).status,404);
}));
test('ongeldige input en cross-site requests worden vóór de agent geweigerd',()=>serverTest(async base=>{
    const a=await session(base);
    assert.equal((await post(base,a.cookie,{prompt:''})).status,400);
    assert.equal((await post(base,a.cookie,{prompt:'a'.repeat(4001)})).status,400);
    assert.equal((await fetch(base+'/api/chat',{method:'POST',headers:{cookie:a.cookie,Origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify({prompt:'TEST'})})).status,403);
}));
test('gelijktijdige mutaties blokkeren dezelfde gebruiker maar geen andere gebruiker',()=>serverTest(async base=>{
    const a=await session(base),b=await session(base);
    const first=post(base,a.cookie,{prompt:'TEST'});await new Promise(resolve=>setTimeout(resolve,30));
    assert.equal((await post(base,a.cookie,{},'/api/session')).status,409);
    assert.equal((await post(base,b.cookie,{},'/api/session')).status,200);
    await(await first).text();
},store=>({chat:async()=>{await new Promise(resolve=>setTimeout(resolve,120));return{answer:'TEST',tools:[],sources:[]};}})));

test('de zevende vraag binnen een minuut wordt niet naar de agent gestuurd',()=>serverTest(async base=>{
    const a=await session(base);
    for(let i=0;i<6;i++){const res=await post(base,a.cookie,{prompt:'TEST '+i});assert.equal(res.status,200);await res.text();}
    assert.equal((await post(base,a.cookie,{prompt:'TEST teveel'})).status,429);
}));
test('upload wordt doorzoekbaar en downloaden/verwijderen blijft afgeschermd',async()=>{
    const dir=mkdtempSync(path.join(tmpdir(),'agent-upload-')),store=new Store(dir);
    const library=new Library(store,{embeddings:{embedDocuments:async texts=>texts.map(()=>[1,0]),embedQuery:async()=>[1,0]}});
    const server=createApp({store,service:{},library}).listen(0,'127.0.0.1');await once(server,'listening');
    const base='http://127.0.0.1:'+server.address().port;
    try{
        const a=await session(base),b=await session(base);
        const body=new FormData();body.append('file',new Blob(['FICTIEVE TESTINHOUD voor documentupload en gebruikersscheiding.']),'TEST.txt');
        const res=await fetch(base+'/api/documents',{method:'POST',headers:{cookie:a.cookie},body});assert.equal(res.status,202);const job=await res.json();
        let result;
        for(let i=0;i<30;i++){result=await(await fetch(base+'/api/jobs/'+job.job,{headers:{cookie:a.cookie}})).json();if(result.status!=='running')break;await new Promise(resolve=>setTimeout(resolve,10));}
        assert.equal(result.status,'done');
        assert.equal((await fetch(base+'/api/jobs/'+job.job,{headers:{cookie:b.cookie}})).status,404);
        const docs=await(await fetch(base+'/api/documents',{headers:{cookie:a.cookie}})).json();assert.equal(docs.length,1);
        assert.equal((await fetch(base+'/api/documents/'+docs[0].id+'/download',{headers:{cookie:b.cookie}})).status,404);
        assert.equal((await fetch(base+'/api/documents/'+docs[0].id+'/download',{headers:{cookie:a.cookie}})).status,200);
        assert.equal((await fetch(base+'/api/documents/'+docs[0].id,{method:'DELETE',headers:{cookie:b.cookie}})).status,404);
        assert.equal((await fetch(base+'/api/documents/'+docs[0].id,{method:'DELETE',headers:{cookie:a.cookie}})).status,200);
    }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));store.close();rmSync(dir,{recursive:true,force:true});}
});
