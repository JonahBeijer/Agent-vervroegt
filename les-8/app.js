import { Store } from '../les-6/store.js';
import { createService } from '../les-6/service.js';
import { createApp } from '../les-6/server.js';
import { Library } from '../les-7/library.js';
import { createTools } from '../les-5/tools.js';
import { documentTool } from './tools.js';
export function createRuntime({directory,embeddings,model}={}) {
    const store=new Store(directory);
    const library=new Library(store,embeddings?{embeddings}:{});
    const service=createService(store,{tools:[documentTool(library),...createTools()],...(model?{model}:{})});
    const app=createApp({store,service,library});
    return {app,store,library,service,close(){service.close();store.close();}};
}
