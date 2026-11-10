import test from 'node:test';
import assert from 'node:assert/strict';
import { configuration } from '../les-5/config.js';
import { createChatModel } from '../les-5/agent.js';
function novaEnv(t) {
    for (const [key, value] of Object.entries({ LLM_PROVIDER:'nova', NOVA_API_KEY:'TEST-SECRET', NOVA_MODEL:'gemma4:26b', NOVA_BASE_URL:'https://api.nova.datalabrotterdam.nl/v1' })) {
        const old = process.env[key]; process.env[key] = value;
        t.after(() => { if (old === undefined) delete process.env[key]; else process.env[key] = old; });
    }
}
test('Nova-configuratie is gereed zonder Azure en publiceert geen secrets', () => {
    const config = configuration({ LLM_PROVIDER:'nova', NOVA_API_KEY:'TEST-SECRET', NEWSDATA_API:'TEST-NEWS' });
    assert.equal(config.configured, true); assert.equal(config.providerName, 'NovaAI'); assert.equal(config.azure, false); assert.equal(config.news, true);
    assert(!JSON.stringify(config).includes('TEST-'));
    assert.equal(configuration({ LLM_PROVIDER:'nova' }).configured, false);
    assert.equal(configuration({ LLM_PROVIDER:'ongeldig', AZURE_OPENAI_API_KEY:'TEST' }).configured, false);
    assert.equal(configuration({ LLM_PROVIDER:'nova', NOVA_API_KEY:'vul-jouw-key-in', NEWSDATA_API:'vul-jouw-key-in' }).news, false);
});
test('Nova-model stuurt echte tooldefinities via chat completions, geen JSON-uitvoerfunctie', async t => {
    novaEnv(t);
    t.mock.method(globalThis, 'fetch', async (url, init) => {
        assert.equal(String(url), 'https://api.nova.datalabrotterdam.nl/v1/chat/completions');
        assert.equal(new Headers(init.headers).get('authorization'), 'Bearer TEST-SECRET');
        const body = JSON.parse(init.body);
        assert.equal(body.model, 'gemma4:26b'); assert.equal(body.parallel_tool_calls, false); assert.equal(body.max_tokens, 2200);
        assert.equal(body.tools[0].function.name, 'current_date');
        return Response.json({id:'TEST',object:'chat.completion',created:0,model:body.model,choices:[{index:0,finish_reason:'tool_calls',message:{role:'assistant',content:null,tool_calls:[{id:'TEST-CALL',type:'function',function:{name:'current_date',arguments:'{}'}}]}}],usage:{prompt_tokens:1,completion_tokens:2,total_tokens:3}});
    });
    const model = createChatModel().bindTools([{ type:'function', function:{ name:'current_date', description:'FICTIEVE TEST', parameters:{type:'object',properties:{}} } }]);
    const result = await model.invoke('TEST');
    assert.equal(result.tool_calls[0].name, 'current_date'); assert.equal(result.usage_metadata.total_tokens, 3);
});
test('Nova weigert een onversleuteld endpoint', t => {
    novaEnv(t); process.env.NOVA_BASE_URL = 'http://example.com/v1';
    assert.throws(createChatModel, /HTTPS/);
});
