import { loadEnvironment } from '../les-5/config.js';
import { createRuntime } from './app.js';
loadEnvironment();
const runtime=createRuntime();
const session=runtime.store.session(null);
try{
    const result=await runtime.service.chat(session,process.argv.slice(2).join(' ')||'Leg uit hoe document search werkt volgens les 7.',event=>{if(event.type==='tool')console.log('[activiteit]',event.event.name,event.event.status);},AbortSignal.timeout(90_000));
    console.log(result.answer);
    console.log('Toolcontrole:',result.tools.map(tool=>({name:tool.name,input:tool.input,status:tool.status,summary:tool.summary})));
    console.log('Bronnen:',result.sources.map(source=>({kind:source.kind,file:source.title,page:source.page,section:source.section,url:source.url})));
    console.log('Tokens:',result.tokens);
}catch(error){console.error(error.message);process.exitCode=1;}finally{runtime.close();}
