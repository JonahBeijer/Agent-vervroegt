import { httpUrl } from './context.js';
const text = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
const markdown = value => text(value).replace(/[\\`*_{}\[\]()#+!|>~]/g, '\\$&');
// Alleen een leesbare weergave van toolgegevens; geen nieuwe claims of AI-samenvatting.
export function newsAnswer(result) {
    if (result?.error || !Array.isArray(result?.articles)) return null;
    const articles = result.articles.filter(article => text(article.title) && text(article.text) && text(article.date) && httpUrl(article.url)).slice(0, 3);
    if (!articles.length) return null;
    return '## Opgehaald technologienieuws\n\nDe nieuwsopvraag is geslaagd. Hieronder staan de beschrijvingen van de nieuwsbronnen; dit is geen door AI gemaakte samenvatting.\n\n' + articles.map(article => {
        const url = httpUrl(article.url).replaceAll('<', '%3C').replaceAll('>', '%3E');
        return '### ' + markdown(article.title) + '\n\n' + markdown(article.text) + '\n\n**Bron:** ' + (markdown(article.publisher) || 'Niet vermeld') + '\n\n**Publicatiedatum:** ' + markdown(article.date) + '\n\n[Lees het artikel](<' + url + '>)';
    }).join('\n\n---\n\n');
}
