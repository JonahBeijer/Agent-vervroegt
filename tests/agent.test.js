import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';
import { createRuntime } from '../les-8/app.js';
class TestModel extends BaseChatModel {
    _llmType(){return 'explicit-fictitious-test-model';}
    bindTools(){return this;}
    async _generate(messages){
        const last=messages.at(-1);
        const base={id:randomUUID(),usage_metadata:{input_tokens:3,output_tokens:2,total_tokens:5}};
        let message;
        if(last._getType()==='tool')message=new AIMessage({...base,content:'FICTIEF TESTANTWOORD na echte tooluitvoering.'});
        else if(last.content==='TRUNCATE')message=new AIMessage({...base,content:'',response_metadata:{finish_reason:'length'}});
        else if(last.content==='READ_TEST')message=new AIMessage({...base,content:'',tool_calls:[{id:randomUUID(),type:'tool_call',name:'search_documents',args:{query:'alpha'}}]});
        else if(last.content==='WHO_TEST')message=new AIMessage({...base,content:messages.some(msg=>msg.content==='REMEMBER_TEST')?'TEST onthouden':'TEST onbekend'});
        else message=new AIMessage({...base,content:'FICTIEF TESTANTWOORD'});
        return {generations:[{text:message.content,message}]};
    }
}
const fakeEmbeddings={embedDocuments:async texts=>texts.map(()=>[1,0,0]),embedQuery:async()=>[1,0,0]};
test('echte agentloop roept retrieval aan en geeft uitsluitend gevonden bronmetadata terug',async()=>{
    const dir=mkdtempSync(path.join(tmpdir(),'agent-loop-'));const runtime=createRuntime({directory:dir,embeddings:fakeEmbeddings,model:new TestModel({})});
    try{
        await runtime.library.add({owner:'shared',name:'TEST.md',bytes:Buffer.from('# TEST\nalpha is expliciet fictieve inhoud voor de geautomatiseerde test.')});
        const session=runtime.store.session(null),events=[];
        const result=await runtime.service.chat(session,'READ_TEST',event=>events.push(event),AbortSignal.timeout(10000));
        assert(result.answer.includes('FICTIEF'));
        assert.equal(result.tools[0].name,'search_documents');
        assert.equal(result.sources[0].title,'TEST.md');
        assert.equal(result.sources[0].kind,'document');
        assert.equal(result.tokens.total,10);
        assert.equal(events.filter(event=>event.event.status==='done').length>=1,true);
        assert.equal(runtime.store.turns(session.active).length,1);
    }finally{runtime.close();rmSync(dir,{recursive:true,force:true});}
});
test('checkpointer overleeft herstart en gesprekken blijven gescheiden',async()=>{
    const dir=mkdtempSync(path.join(tmpdir(),'agent-memory-'));let runtime=createRuntime({directory:dir,embeddings:fakeEmbeddings,model:new TestModel({})});
    try{
        let session=runtime.store.session(null);const cookie=session.rawToken;
        await runtime.service.chat(session,'REMEMBER_TEST',()=>{},AbortSignal.timeout(10000));
        runtime.close();runtime=createRuntime({directory:dir,embeddings:fakeEmbeddings,model:new TestModel({})});
        session=runtime.store.session(cookie);
        assert.equal((await runtime.service.chat(session,'WHO_TEST',()=>{},AbortSignal.timeout(10000))).answer,'TEST onthouden');
        const other=runtime.store.session(null);
        assert.equal((await runtime.service.chat(other,'WHO_TEST',()=>{},AbortSignal.timeout(10000))).answer,'TEST onbekend');
        runtime.store.newThread(session);
        assert.equal((await runtime.service.chat(session,'WHO_TEST',()=>{},AbortSignal.timeout(10000))).answer,'TEST onbekend');
    }finally{runtime.close();rmSync(dir,{recursive:true,force:true});}
});
test('afgebroken modeloutput telt tokens maar verandert geslaagde geschiedenis niet',async()=>{
    const dir=mkdtempSync(path.join(tmpdir(),'agent-error-'));const runtime=createRuntime({directory:dir,embeddings:fakeEmbeddings,model:new TestModel({})});
    try{
        const session=runtime.store.session(null);
        await runtime.service.chat(session,'REMEMBER_TEST',()=>{},AbortSignal.timeout(10000));
        await assert.rejects(runtime.service.chat(session,'TRUNCATE',()=>{},AbortSignal.timeout(10000)),error=>error.code==='OUTPUT_LIMIT'&&error.tokens.total===5);
        assert.equal(runtime.store.turns(session.active).length,1);
        assert.equal((await runtime.service.chat(session,'WHO_TEST',()=>{},AbortSignal.timeout(10000))).answer,'TEST onthouden');
    }finally{runtime.close();rmSync(dir,{recursive:true,force:true});}
});
