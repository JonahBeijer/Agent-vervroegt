import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Store } from '../les-6/store.js';
import { Library, chunksOf, cosine } from '../les-7/library.js';
const vector = text => ['alpha','beta','gamma'].map(word => text.toLowerCase().split(word).length - 1);
const embeddings = { embedDocuments: async texts => texts.map(vector), embedQuery: async text => vector(text) };
test('lange tekst wordt begrensd gesplitst met overlap en eindigt volledig', async () => {
    const text='alpha beta gamma '.repeat(150);const chunks=await chunksOf(text);
    assert(chunks.length>1);assert(chunks.every(chunk=>chunk.length<=950));assert(chunks.at(-1).endsWith('gamma'));
    assert.equal(cosine([1,0],[0,1]),0);assert.equal(cosine([1,0],[1,0]),1);
});
test('documenten zijn persistent en retrieval is per eigenaar afgeschermd',async()=>{
    const directory=mkdtempSync(path.join(tmpdir(),'agent-library-'));
    let store=new Store(directory);let library=new Library(store,{embeddings});
    try{
        const shared=await library.add({owner:'shared',name:'les.md',bytes:Buffer.from('# Les\nalpha is een gedeeld lesonderwerp. '.repeat(4))});
        const privateId=await library.add({owner:'a',name:'eigen.md',bytes:Buffer.from('# Eigen\nbeta is uitsluitend van gebruiker a. '.repeat(4))});
        assert.equal(library.list('a').length,2);assert.equal(library.list('b').length,1);
        assert.equal(library.file(privateId,'b'),null);
        assert.equal((await library.search('beta','b')).length,0);
        assert.equal((await library.search('beta','a'))[0].doc,privateId);
        assert.equal(library.remove(shared,'a'),false);
        store.close();store=new Store(directory);library=new Library(store,{embeddings});
        assert.equal((await library.search('beta','a'))[0].doc,privateId);
        assert.equal(library.remove(privateId,'a'),true);assert.equal(library.list('a').length,1);
        assert.equal((await library.search('beta','a')).length,0);
    }finally{store.close();rmSync(directory,{recursive:true,force:true});}
});
test('ontbrekende tekst wordt niet als doorzoekbaar document opgeslagen',async()=>{
    const directory=mkdtempSync(path.join(tmpdir(),'agent-empty-'));const store=new Store(directory),library=new Library(store,{embeddings});
    try{await assert.rejects(library.add({owner:'a',name:'leeg.txt',bytes:Buffer.from(' ')}));assert.equal(library.list('a').length,0);}
    finally{store.close();rmSync(directory,{recursive:true,force:true});}
});
