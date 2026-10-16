import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadEnvironment } from '../les-5/config.js';
import { Store } from '../les-6/store.js';
import { Library } from './library.js';
loadEnvironment();
const store=new Store(),library=new Library(store);
try{
    if(!process.argv[2])throw new Error('Gebruik: npm run index -- pad/naar/document.pdf');
    for(const file of process.argv.slice(2)){
        await library.add({owner:'shared',name:path.basename(file),bytes:readFileSync(file)},(phase,percent)=>console.log(phase,percent+'%'));
    }
    console.log('Bibliotheek:',library.list('shared').map(doc=>({name:doc.name,pages:doc.pdfPages,chunks:doc.chunks})));
}finally{store.close();}
