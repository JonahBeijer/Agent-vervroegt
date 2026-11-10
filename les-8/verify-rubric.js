import assert from 'node:assert/strict';
import { loadEnvironment, configuration } from '../les-5/config.js';
import { Store } from '../les-6/store.js';
import { Library, chunksOf } from '../les-7/library.js';
loadEnvironment();
const store = new Store();
try {
    const library = new Library(store);
    const documents = library.list('shared');
    const totals = { documents: documents.length, pdfPages: documents.reduce((sum, doc) => sum + doc.pdfPages, 0), chunks: documents.reduce((sum, doc) => sum + doc.chunks, 0) };
    totals.indexedPdfPages = store.db.prepare("SELECT count(*) AS count FROM (SELECT c.doc,c.page FROM chunks c JOIN documents d ON d.id=c.doc WHERE d.owner='shared' AND c.page IS NOT NULL GROUP BY c.doc,c.page)").get().count;
    console.log('Provider (geen sleutels):', configuration());
    console.table(documents.map(doc => ({ file: doc.name, pdfPages: doc.pdfPages, chunks: doc.chunks })));
    console.log('Totaal:', totals);
    assert(totals.documents >= 2, 'Er moeten meerdere documenten zijn.');
    assert(totals.indexedPdfPages >= 10, 'Minimaal tien PDF-pagina’s moeten daadwerkelijk tekstfragmenten in de vectorstore hebben.');
    const chunks = await chunksOf('Document search met LangChain splitst relevante lesinhoud in overlappende fragmenten. '.repeat(30));
    const vectors = await library.embeddings.embedDocuments(chunks.slice(0, 2));
    assert(chunks.length > 1 && vectors.length === 2 && vectors.every(vector => vector.length === 384 && vector.every(Number.isFinite)));
    console.log('LangChain splitter + echte lokale embeddings:', { chunks: chunks.length, dimensions: vectors[0].length });
    for (const [query, expected] of [
        ['MemorySaver thread_id checkpointer', /^Les 6 - /],
        ['embeddings vector database document search', /^Les 7 - /],
        ['document search tool agent', /^Les 8 - /],
    ]) {
        const hits = await library.search(query, 'shared', 4);
        console.log('Zoekvraag:', query);
        console.table(hits.map(hit => ({ file: hit.name, page: hit.page, section: hit.section, score: Number(hit.score.toFixed(4)) })));
        assert(hits.some(hit => expected.test(hit.name)), 'Verwachte les niet gevonden voor: ' + query);
    }
    console.log('GESLAAGD: corpusomvang, LangChain-splitsing, embeddings en verwachte zoekdocumenten gecontroleerd. Geen cursuspassages naar een externe AI-provider gestuurd.');
} finally { store.close(); }
