import { randomUUID } from 'node:crypto';
import { loadEnvironment } from './config.js';
import { createAssistant } from './agent.js';
import { runContext } from './context.js';
loadEnvironment();
const prompt = process.argv.slice(2).join(' ') || 'Hallo! Waarmee kun je me helpen?';
const context = { ownerId: 'console', events: [], sources: new Map(), anime: new Map(), signal: AbortSignal.timeout(75_000) };
try {
    const result = await runContext.run(context, () => createAssistant().invoke({ messages: [{ role: 'user', content: prompt }] }, { configurable: { thread_id: randomUUID() }, signal: context.signal, recursionLimit: 16 }));
    console.log(result.messages.at(-1).content);
    console.log('Uitgevoerde tools:', context.events.map(event => event.name).join(', ') || 'geen');
} catch (error) { console.error(['AZURE_NOT_CONFIGURED','MODEL_NOT_CONFIGURED'].includes(error.code) ? error.message : 'Agentaanroep mislukt. Controleer configuratie en verbinding.'); process.exitCode = 1; }
