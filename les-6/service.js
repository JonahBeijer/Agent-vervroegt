import path from 'node:path';
import { configuration } from '../les-5/config.js';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { RemoveMessage } from '@langchain/core/messages';
import { REMOVE_ALL_MESSAGES } from '@langchain/langgraph';
import { createAssistant } from '../les-5/agent.js';
import { createTools } from '../les-5/tools.js';
import { runContext } from '../les-5/context.js';
export function tokenUsage(messages) {
    const measured = messages.map(message => message.usage_metadata).filter(Boolean);
    return measured.length ? measured.reduce((sum, usage) => ({ input: sum.input + usage.input_tokens, output: sum.output + usage.output_tokens, total: sum.total + usage.total_tokens }), { input: 0, output: 0, total: 0 }) : null;
}
export function createService(store, { tools = createTools(), model, agent: suppliedAgent } = {}) {
    const saver = suppliedAgent ? null : SqliteSaver.fromConnString(path.join(store.directory, 'checkpoints.sqlite'));
    let instance = suppliedAgent;
    const getAgent = () => instance ||= createAssistant({ checkpointer: saver, tools, ...(model ? { model } : {}) });
    return {
        async chat(session, prompt, emit, signal) {
            const agent = getAgent();
            const config = { configurable: { thread_id: session.active }, signal, recursionLimit: 16 };
            const previous = await agent.getState(config);
            const prior = previous.values?.messages || [];
            const ids = new Set(prior.map(message => message.id));
            const context = { ownerId: session.owner, events: [], sources: new Map(), anime: new Map(), emit, signal };
            let messages = [], tokens;
            try {
                const result = await runContext.run(context, () => agent.invoke({ messages: [{ role: 'user', content: prompt }] }, config));
                messages = result.messages.filter(message => !ids.has(message.id));
                tokens = tokenUsage(messages);
                const final = result.messages.at(-1);
                if (final.response_metadata?.finish_reason === 'length') throw Object.assign(new Error('Het antwoord bereikte de uitvoerlimiet. Vraag om een kortere uitleg.'), { code: 'OUTPUT_LIMIT' });
                const answer = typeof final.content === 'string' ? final.content : final.content.filter(block => block.type === 'text').map(block => block.text).join('\n');
                if (!answer?.trim() || final.tool_calls?.length) throw Object.assign(new Error('De agent kon zijn antwoord niet afronden. Probeer een gerichtere vraag.'), { code: 'EMPTY_ANSWER' });
                const detail = { tokens, tools: context.events, sources: [...context.sources.values()] };
                store.saveTurn(session, prompt, answer, detail);
                return { answer, ...detail };
            } catch (error) {
                try {
                    const partial = await agent.getState({ configurable: config.configurable });
                    if (!tokens) tokens = tokenUsage((partial.values?.messages || []).filter(message => !ids.has(message.id)));
                    if (prior.length) await agent.updateState({ configurable: config.configurable }, { messages: [new RemoveMessage({ id: REMOVE_ALL_MESSAGES }), ...prior] });
                    else await saver?.deleteThread(session.active);
                } catch { /* De fout blijft zichtbaar; ruwe providerdetails worden nooit verstuurd. */ }
                const code = signal?.aborted ? 'ABORTED' : ['AZURE_NOT_CONFIGURED','MODEL_NOT_CONFIGURED'].includes(error.code) ? 'MODEL_NOT_CONFIGURED' : error.status === 429 ? 'RATE_LIMIT' : error.code === 'OUTPUT_LIMIT' || error.code === 'EMPTY_ANSWER' ? error.code : 'AGENT_ERROR';
                const texts = { ABORTED: 'De aanvraag is afgebroken of duurde te lang.', MODEL_NOT_CONFIGURED: configuration().providerName + ' is nog niet ingesteld. Controleer het externe env-bestand.', RATE_LIMIT: 'De limiet van ' + configuration().providerName + ' is bereikt. Probeer later opnieuw.', OUTPUT_LIMIT: 'Het antwoord bereikte de uitvoerlimiet. Vraag om een kortere uitleg.', EMPTY_ANSWER: 'De agent kon zijn antwoord niet afronden. Probeer een gerichtere vraag.', AGENT_ERROR: 'De agent kon niet antwoorden. Controleer de configuratie of probeer opnieuw.' };
                throw Object.assign(new Error(texts[code]), { code, tokens, tools: context.events });
            }
        },
        close() { saver?.db.close(); },
    };
}
