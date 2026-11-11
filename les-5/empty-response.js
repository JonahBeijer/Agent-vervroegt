import { createMiddleware } from 'langchain';
import { AIMessage, isAIMessage } from '@langchain/core/messages';
import { runContext } from './context.js';
import { newsAnswer } from './news-answer.js';
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
            if (!context || context.signal?.aborted) return result;
            const answer = newsAnswer(context.newsResult);
            if (answer) {
                console.info('[agent model]', { issue: 'empty_response', action: 'show_news_tool_result' });
                return new AIMessage({ id: result.id, content: answer, usage_metadata: result.usage_metadata, response_metadata: { ...result.response_metadata, answer_source: 'news_tool' } });
            }
            if (context.emptyRecoveryUsed) return result;
            // Eén extra modelaanvraag per gebruikersvraag; reeds uitgevoerde tools worden niet opnieuw uitgevoerd.
            context.emptyRecoveryUsed = true;
            (context.discardedModelMessages ||= []).push(result);
            console.warn('[agent model]', { issue: 'empty_response', action: 'retry_once', finishReason: reason || 'unknown', invalidToolCalls: result.invalid_tool_calls?.length || 0 });
            const extra = '\nJe vorige modelantwoord was leeg. Rond de oorspronkelijke vraag af met een kort Nederlands tekstantwoord op basis van de beschikbare toolresultaten. Verzin geen resultaten. Gebruik alleen nog een tool als noodzakelijke gegevens echt ontbreken.';
            return handler({ ...request, systemMessage: request.systemMessage.concat(extra) });
        },
    });
}
