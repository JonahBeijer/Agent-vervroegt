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

class EmptyResponseTestModel extends BaseChatModel {
    _llmType(){return 'explicit-fictitious-empty-response-test';}
    bindTools(){return this;}
    calls = 0;
    finalAttempts = 0;
    mode = 'after-tool';
    async _generate(messages) {
        this.calls++;
        const last = messages.at(-1);
        const base = {id:randomUUID(),usage_metadata:{input_tokens:3,output_tokens:2,total_tokens:5},response_metadata:{finish_reason:'stop'}};
        let message;
        if(this.mode === 'before-tool' && this.calls === 1) message = new AIMessage({...base,content:''});
        else if(last._getType() !== 'tool') message = new AIMessage({...base,content:'',tool_calls:[{id:randomUUID(),type:'tool_call',name:'current_date',args:{}}]});
        else {
            this.finalAttempts++;
            const empty = this.mode === 'always-empty' || (this.mode === 'after-tool' && this.finalAttempts === 1);
            message = new AIMessage({...base,content:empty ? [{type:'text',text:'   '}] : 'FICTIEF TESTANTWOORD na datumtool.'});
        }
        return {generations:[{text:typeof message.content === 'string' ? message.content : '',message}]};
    }
}
for (const mode of ['before-tool', 'after-tool']) test('leeg modelantwoord herstelt zonder dubbele tooluitvoering: '+mode,async()=>{
    const dir=mkdtempSync(path.join(tmpdir(),'agent-empty-recovery-'));
    const model=new EmptyResponseTestModel({}); model.mode=mode;
    const runtime=createRuntime({directory:dir,embeddings:fakeEmbeddings,model});
    try {
        const session=runtime.store.session(null);
        const result=await runtime.service.chat(session,'FICTIEVE DATUMTEST',()=>{},AbortSignal.timeout(10000));
        assert.equal(model.calls,3); assert.equal(result.tools.length,1);
        assert.equal(result.tools[0].name,'current_date'); assert.equal(result.tools[0].status,'done');
        assert.equal(result.tokens.total,15); assert.equal(runtime.store.turns(session.active).length,1);
        assert.match(result.answer,/FICTIEF/);
    } finally {runtime.close();rmSync(dir,{recursive:true,force:true});}
});
test('blijvend leeg antwoord stopt na één herstelpoging en bewaart geen ongeldige ronde',async()=>{
    const dir=mkdtempSync(path.join(tmpdir(),'agent-empty-failed-'));
    const model=new EmptyResponseTestModel({}); model.mode='always-empty';
    const runtime=createRuntime({directory:dir,embeddings:fakeEmbeddings,model});
    try {
        const session=runtime.store.session(null);
        await assert.rejects(runtime.service.chat(session,'FICTIEVE DATUMTEST',()=>{},AbortSignal.timeout(10000)),error=>error.code==='EMPTY_ANSWER'&&error.tokens.total===15&&error.tools.length===1);
        assert.equal(model.calls,3); assert.equal(runtime.store.turns(session.active).length,0);
    } finally {runtime.close();rmSync(dir,{recursive:true,force:true});}
});
