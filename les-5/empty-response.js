import { createMiddleware } from 'langchain';
import { isAIMessage } from '@langchain/core/messages';
import { runContext } from './context.js';
export function messageText(message) {
    if (typeof message?.content === 'string') return message.content;
    return Array.isArray(message?.content) ? message.content.filter(block => block.type === 'text').map(block => block.text || '').join('\n') : '';
}
export function emptyResponseMiddleware() {
    return createMiddleware({
        name: 'EmptyResponseRecovery',
        wrapModelCall: async (request, handler) => {
            const result = await handler(request);
            if (!isAIMessage(result) || result.tool_calls?.length || messageText(result).trim()) return result;
            const reason = result.response_metadata?.finish_reason;
            if ((reason && reason !== 'stop') || result.additional_kwargs?.refusal) return result;
            const context = runContext.getStore();
            if (!context || context.emptyRecoveryUsed || context.signal?.aborted) return result;
            // Eén extra modelaanvraag per gebruikersvraag; reeds uitgevoerde tools worden niet opnieuw uitgevoerd.
            context.emptyRecoveryUsed = true;
            (context.discardedModelMessages ||= []).push(result);
            console.warn('[agent model]', { issue: 'empty_response', action: 'retry_once', finishReason: reason || 'unknown', invalidToolCalls: result.invalid_tool_calls?.length || 0 });
            const extra = '\nJe vorige modelantwoord was leeg. Rond de oorspronkelijke vraag af met een kort Nederlands tekstantwoord op basis van de beschikbare toolresultaten. Verzin geen resultaten. Gebruik alleen nog een tool als noodzakelijke gegevens echt ontbreken.';
            return handler({ ...request, systemMessage: request.systemMessage.concat(extra) });
        },
    });
}
