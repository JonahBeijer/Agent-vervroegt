import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';
import { newsAnswer } from '../les-5/news-answer.js';
import { createRuntime } from '../les-8/app.js';
const article = {title:'FICTIEVE TESTBRON over robots',text:'FICTIEVE beschrijving met code NIEUWS-731, uitsluitend voor deze test.',date:'2026-11-11 10:00:00',publisher:'Fictieve testkrant',url:'https://example.com/testnieuws'};
const embeddings = {embedDocuments:async texts=>texts.map(()=>[1,0]),embedQuery:async()=>[1,0]};
class NewsModel extends BaseChatModel {
    _llmType(){return 'explicit-fictitious-news-empty-test';}
    bindTools(){return this;}
    calls = 0;
    mode = 'empty';
    async _generate(messages) {
        this.calls++;
        const last=messages.at(-1);
        const base={id:randomUUID(),usage_metadata:{input_tokens:3,output_tokens:2,total_tokens:5}};
        let message;
        if(last.content==='WELKE BRON') message=new AIMessage({...base,content:messages.some(item=>typeof item.content==='string'&&item.content.includes('NIEUWS-731'))?'NIEUWS-731 onthouden':'Niet onthouden'});
        else if(last._getType() !== 'tool') message=new AIMessage({...base,content:'',tool_calls:[{id:randomUUID(),type:'tool_call',name:'technology_news',args:{category:'technology'}}]});
        else message=new AIMessage({...base,content:this.mode==='normal'?'FICTIEF NORMAAL MODELANTWOORD':'',response_metadata:{finish_reason:this.mode==='blocked'?'content_filter':this.mode==='truncated'?'length':'stop'}});
        return {generations:[{text:message.content,message}]};
    }
}
function setupNews(t, fail=false) {
    const old=process.env.NEWSDATA_API;process.env.NEWSDATA_API='TEST-SECRET';
    t.after(()=>{if(old===undefined)delete process.env.NEWSDATA_API;else process.env.NEWSDATA_API=old;});
    let requests=0;
    t.mock.method(globalThis,'fetch',async url=>{
        requests++;assert.equal(new URL(url).searchParams.get('apikey'),'TEST-SECRET');
        return Response.json(fail?{status:'error',results:[]}:{status:'success',results:[{title:article.title,description:article.text,pubDate:article.date,source_name:article.publisher,link:article.url}]});
    });
    return ()=>requests;
}
test('nieuwsweergave gebruikt uitsluitend echte toolvelden en ontsnapt Markdown',()=>{
    const answer=newsAnswer({articles:[{...article,title:'[FICTIEVE](javascript:alert(1))',text:'**Dit is brontekst**'}]});
    assert(answer.includes(article.publisher));assert(answer.includes(article.date));assert(answer.includes(article.url));
    assert(answer.includes('geen door AI gemaakte samenvatting'));
    assert(!answer.includes('### [FICTIEVE]'));
    for(const invalid of [undefined,{error:'API weigert',articles:[article]},{articles:[]},{articles:[{...article,date:''}]},{articles:[{...article,url:'javascript:alert(1)'}]}])assert.equal(newsAnswer(invalid),null);
});
test('lege modeluitvoer na nieuwstool geeft direct antwoord, bronnen, tokens en duurzaam geheugen',async t=>{
    const requests=setupNews(t);
    const directory=mkdtempSync(path.join(tmpdir(),'agent-news-direct-'));
    const model=new NewsModel({});let runtime=createRuntime({directory,embeddings,model});
    try {
        let session=runtime.store.session(null);const cookie=session.rawToken;
        const result=await runtime.service.chat(session,'FICTIEVE NIEUWSVRAAG',()=>{},AbortSignal.timeout(10000));
        assert.equal(model.calls,2);assert.equal(requests(),1);
        assert.match(result.answer,/NIEUWS-731/);assert.match(result.answer,/Publicatiedatum/);assert(result.answer.includes(article.url));
        assert.equal(result.tools.length,1);assert.equal(result.tools[0].status,'done');
        assert.equal(result.sources.length,1);assert.equal(result.sources[0].title,article.title);
        assert.equal(result.tokens.total,10);assert.equal(runtime.store.turns(session.active).length,1);
        runtime.close();runtime=createRuntime({directory,embeddings,model:new NewsModel({})});
        session=runtime.store.session(cookie);
        assert(runtime.store.turns(session.active)[0].answer.includes('NIEUWS-731'));
        const followUp=await runtime.service.chat(session,'WELKE BRON',()=>{},AbortSignal.timeout(10000));
        assert.equal(followUp.answer,'NIEUWS-731 onthouden');assert.equal(requests(),1);
    } finally {runtime.close();rmSync(directory,{recursive:true,force:true});}
});
for (const mode of ['normal','blocked','truncated']) test('nieuwsweergave overschrijft geen '+mode+' modelantwoord',async t=>{
    const requests=setupNews(t);const directory=mkdtempSync(path.join(tmpdir(),'agent-news-mode-'));
    const model=new NewsModel({});model.mode=mode;const runtime=createRuntime({directory,embeddings,model});
    try {
        const session=runtime.store.session(null);
        if(mode==='normal')assert.equal((await runtime.service.chat(session,'TEST',()=>{},AbortSignal.timeout(10000))).answer,'FICTIEF NORMAAL MODELANTWOORD');
        else await assert.rejects(runtime.service.chat(session,'TEST',()=>{},AbortSignal.timeout(10000)),{code:mode==='truncated'?'OUTPUT_LIMIT':'EMPTY_ANSWER'});
        assert.equal(model.calls,2);assert.equal(requests(),1);
    } finally {runtime.close();rmSync(directory,{recursive:true,force:true});}
});
test('mislukte nieuwsopvraag maakt geen verzonnen nieuwsantwoord',async t=>{
    const requests=setupNews(t,true);const directory=mkdtempSync(path.join(tmpdir(),'agent-news-fail-'));
    const model=new NewsModel({});const runtime=createRuntime({directory,embeddings,model});
    try {
        const session=runtime.store.session(null);
        await assert.rejects(runtime.service.chat(session,'TEST',()=>{},AbortSignal.timeout(10000)),error=>error.code==='EMPTY_ANSWER'&&error.tools[0].status==='error');
        assert.equal(model.calls,3);assert.equal(requests(),1);assert.equal(runtime.store.turns(session.active).length,0);
    } finally {runtime.close();rmSync(directory,{recursive:true,force:true});}
});
