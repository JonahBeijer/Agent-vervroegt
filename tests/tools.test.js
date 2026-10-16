import test from 'node:test';
import assert from 'node:assert/strict';
import { createTools } from '../les-5/tools.js';
import { runContext } from '../les-5/context.js';
const context = () => ({ ownerId: 'test', events: [], sources: new Map(), anime: new Map() });
test('datumtool gebruikt de Amsterdamse tijd en registreert uitvoering', async () => {
    const c = context();
    const result = await runContext.run(c, () => createTools({ clock: () => new Date('2026-10-16T09:00:00Z') })[0].invoke({}));
    assert(result.date.includes('11:00:00')); assert.equal(c.events[0].status, 'done');
});
test('studieverdeling behoudt de beschikbare minuten en weigert ongeldige invoer', async () => {
    const c = context(), tool = createTools()[1];
    const result = await runContext.run(c, () => tool.invoke({ days: 3, hoursPerDay: 1.5, topics: ['Tools', 'Memory', 'Documenten', 'Testen'] }));
    assert.equal(result.totalMinutes, 270);
    assert.equal(result.topics.reduce((sum, topic) => sum + topic.minutes, 0), 270);
    assert.equal(result.days.reduce((sum, day) => sum + day.minutes, 0), 270);
    await assert.rejects(runContext.run(c, () => tool.invoke({ days: -1, hoursPerDay: 1, topics: ['Tools'] })));
});
test('providerexceptions lekken geen sleutels of verzonnen resultaten', async t => {
    const original = process.env.NEWSDATA_API; process.env.NEWSDATA_API = 'TEST-KEY';
    t.after(() => { if(original === undefined) delete process.env.NEWSDATA_API; else process.env.NEWSDATA_API = original; });
    const c = context(), tools = createTools({ request: async () => { throw new Error('SECRET API KEY'); } });
    const result = await runContext.run(c, () => tools[2].invoke({ category: 'technology' }));
    assert(result.error); assert(!JSON.stringify(result).includes('SECRET')); assert.equal(c.sources.size, 0); assert.equal(c.events[0].status, 'error');
});
test('tools weigeren uitvoering zonder servercontext', async () => { await assert.rejects(createTools()[0].invoke({}), /actieve serveraanvraag/); });
test('nieuwstool weigert ongeldige categorieën vóór een request', async () => {
    const c = context(), tools = createTools({ request: async () => assert.fail('geen request') });
    await assert.rejects(runContext.run(c, () => tools[2].invoke({ category: 'sports' })));
});
