import test from 'node:test';
import assert from 'node:assert/strict';
import { createTools } from '../les-5/tools.js';
import { runContext } from '../les-5/context.js';
const context = () => ({ ownerId: 'test', events: [], sources: new Map(), anime: new Map() });
test('datumtool gebruikt de Amsterdamse tijd en registreert een echte tooluitvoering', async () => {
    const c = context();
    const date = createTools({ clock: () => new Date('2026-10-16T09:00:00Z') })[2];
    const result = await runContext.run(c, () => date.invoke({}));
    assert(result.date.includes('11:00:00'));
    assert.equal(c.events[0].status, 'done');
});
test('cataloguskaarten komen uitsluitend uit geldige API-resultaten', async () => {
    const c = context();
    const tools = createTools({ request: async url => {
        assert.equal(url.origin, 'https://api.jikan.moe');
        assert.equal(url.searchParams.get('sfw'), 'true');
        return Response.json({ data: [{ mal_id: 1, title: 'TEST ANIME', url: 'https://example.com/anime', synopsis: 'Fictieve testdata', images: {}, genres: [] }, { title: 'ongeldig', url: 'javascript:alert(1)' }] });
    } });
    const result = await runContext.run(c, () => tools[1].invoke({ query: 'TEST' }));
    assert.equal(result.anime.length, 1);
    assert.equal(c.anime.get('1').title, 'TEST ANIME');
    assert.equal(c.sources.size, 1);
});
test('providerexceptions lekken geen sleutels en worden geen verzonnen resultaten', async () => {
    const c = context();
    const tools = createTools({ request: async () => { throw new Error('SECRET API KEY'); } });
    const result = await runContext.run(c, () => tools[1].invoke({ query: 'TEST' }));
    assert(result.error);
    assert(!JSON.stringify(result).includes('SECRET'));
    assert.equal(c.anime.size, 0);
    assert.equal(c.events[0].status, 'error');
});
test('tools weigeren uitvoering zonder servercontext', async () => {
    await assert.rejects(createTools()[2].invoke({}), /actieve serveraanvraag/);
});
test('nieuwstool weigert categorieën buiten de focus vóór een request', async () => {
    const c = context();
    const tools = createTools({ request: async () => assert.fail('geen request') });
    await assert.rejects(runContext.run(c, () => tools[0].invoke({ category: 'sports' })));
});
