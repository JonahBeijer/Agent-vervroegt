import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { tool } from 'langchain';
export const runContext = new AsyncLocalStorage();
export function httpUrl(value) {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function trackedTool(name, description, schema, action) {
    return tool(async input => {
        const context = runContext.getStore();
        if (!context) throw new Error('Tool vereist een actieve serveraanvraag.');
        if (context.events.length >= 6) return { error: 'Het maximum van zes toolaanroepen is bereikt. Geef een antwoord met de beschikbare resultaten.' };
        const event = { id: randomUUID(), name, input, status: 'running', started: Date.now() };
        context.events.push(event); context.emit?.({ type: 'tool', event });
        try {
            context.signal?.throwIfAborted();
            const result = await action(input, context);
            event.status = result.error ? 'error' : 'done';
            event.summary = result.error || result.summary || 'Tool uitgevoerd';
            for (const source of result.sources || []) {
                if (source.kind === 'document' || httpUrl(source.url)) context.sources.set(source.id, source);
            }
            for (const anime of result.anime || []) context.anime.set(anime.id, anime);
            return result;
        } catch (error) {
            event.status = 'error';
            // Geen provider-URL of API-key uit een exception doorgeven.
            event.summary = error.name === 'AbortError' || context.signal?.aborted ? 'Aanvraag afgebroken.' : 'De externe bron is tijdelijk niet beschikbaar. Verzin geen vervangende resultaten.';
            return { error: event.summary };
        } finally {
            event.durationMs = Date.now() - event.started;
            context.emit?.({ type: 'tool', event: { ...event } });
            console.log('[tool]', name, event.status, event.durationMs + 'ms');
        }
    }, { name, description, schema });
}
export async function getJson(url, { signal, request = fetch } = {}) {
    const timeout = AbortSignal.timeout(15_000);
    const response = await request(url, { signal: AbortSignal.any([timeout, ...(signal ? [signal] : [])]) });
    if (!response.ok) return { error: response.status === 429 ? 'De bron heeft zijn aanvraaglimiet bereikt.' : 'De bron weigert de aanvraag of is onbereikbaar.' };
    return response.json();
}
