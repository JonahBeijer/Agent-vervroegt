// Uitsluitend lokale browsercontrole met expliciete fictieve data. Geen Azure.
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage } from '@langchain/core/messages';
import { createRuntime } from '../les-8/app.js';
class UITestModel extends BaseChatModel{
    _llmType(){return 'fictitious-ui-test';}
    bindTools(){return this;}
    async _generate(messages){
        await new Promise(resolve=>setTimeout(resolve,400));
        const last=messages.at(-1);
        const message=last._getType()==='tool'?new AIMessage({id:randomUUID(),content:'## FICTIEVE BROWSERTEST\nDeze test bevestigt **bronweergave**, chat en toolstatus.\n\n- Dit is geen echt modelantwoord.\n- Bron: TEST-lesmateriaal.md, sectie 1.',usage_metadata:{input_tokens:20,output_tokens:15,total_tokens:35}}):new AIMessage({id:randomUUID(),content:'',tool_calls:[{id:randomUUID(),type:'tool_call',name:'search_documents',args:{query:'TEST alpha'}}],usage_metadata:{input_tokens:20,output_tokens:5,total_tokens:25}});
        return{generations:[{text:message.content,message}]};
    }
}
const directory=mkdtempSync(path.join(tmpdir(),'study-ui-'));
const runtime=createRuntime({directory,embeddings:{embedDocuments:async texts=>texts.map(()=>[1,0]),embedQuery:async()=>[1,0]},model:new UITestModel({})});
await runtime.library.add({owner:'shared',name:'TEST-lesmateriaal.md',bytes:Buffer.from('# TEST\nTEST alpha is uitsluitend fictieve inhoud voor de browsercontrole.')});
const server=runtime.app.listen(3002,'127.0.0.1',()=>console.log('FICTIEVE UI TEST http://127.0.0.1:3002/'));
process.on('SIGINT',()=>server.close(()=>{runtime.close();rmSync(directory,{recursive:true,force:true});process.exit(0);}));
