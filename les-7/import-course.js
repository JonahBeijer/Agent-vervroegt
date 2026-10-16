import { readFileSync, existsSync } from 'node:fs';
import { unzipSync } from 'fflate';
import path from 'node:path';
import os from 'node:os';
import { loadEnvironment } from '../les-5/config.js';
import { Store } from '../les-6/store.js';
import { Library } from './library.js';
loadEnvironment();
const suffixes=['530 PM.zip','555 PM.zip','555 PM (1).zip','556 PM.zip'];
const defaults=suffixes.map(suffix=>path.join(os.homedir(),'Downloads','Smart Technologies - 10162026 - '+suffix));
const archives=process.argv.slice(2).length?process.argv.slice(2):defaults;
const store=new Store(),library=new Library(store);
try{
    for(let i=0;i<archives.length;i++){
        const archive=archives[i];
        if(!existsSync(archive))throw new Error('Archief ontbreekt: '+path.basename(archive)+'. Geef ZIP-paden mee via npm run import:course -- pad.zip');
        const entries=unzipSync(new Uint8Array(readFileSync(archive)),{filter:file=>/\.(pdf|html)$/i.test(file.name) && !file.name.endsWith('Table of Contents.html')});
        for(const [name,bytes] of Object.entries(entries)){
            const safe=path.basename(name);
            console.log('Import:',safe);
            await library.add({owner:'shared',name:'Les '+(i+5)+' - '+safe,bytes:Buffer.from(bytes)},(phase,percent)=>{if(percent===5||percent===100)console.log(' ',phase,percent+'%');});
        }
    }
    const docs=library.list('shared');console.log(JSON.stringify({documents:docs.length,pdfPages:docs.reduce((sum,doc)=>sum+doc.pdfPages,0),chunks:docs.reduce((sum,doc)=>sum+doc.chunks,0)}));
} catch(error){console.error(error.publicMessage||error.message);process.exitCode=1;}finally{store.close();}
