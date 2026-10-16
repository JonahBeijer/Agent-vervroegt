import { z } from 'zod';
import { trackedTool, getJson, httpUrl } from './context.js';
export function createTools({ request = fetch, clock = () => new Date() } = {}) {
    const currentDate = trackedTool('current_date', 'Haal de huidige datum en tijd in Nederland op om relatieve planningsvragen te begrijpen. Verzin geen cursusdeadlines.', z.object({}), async () => ({ date: clock().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }), summary: 'Huidige datum en tijd opgehaald.' }));
    const plan = trackedTool('make_study_plan', 'Bereken een haalbare studieverdeling over beschikbare dagen en onderwerpen. Gebruik voor concrete planning; de tool maakt geen agenda-afspraken en kent geen officiële deadlines.', z.object({ days: z.number().int().min(1).max(14), hoursPerDay: z.number().min(0.5).max(6), topics: z.array(z.string().min(1).max(100)).min(1).max(8) }), async ({ days, hoursPerDay, topics }) => {
        const dailyMinutes = Math.round(hoursPerDay * 60);
        const totalMinutes = days * dailyMinutes;
        const perTopic = Math.floor(totalMinutes / topics.length);
        return { summary: 'Studieverdeling berekend voor ' + days + ' dagen.', totalMinutes, topics: topics.map((topic, i) => ({ topic, minutes: perTopic + (i < totalMinutes % topics.length ? 1 : 0) })), days: Array.from({ length: days }, (_, i) => ({ day: i + 1, minutes: dailyMinutes, focus: topics[i % topics.length] })), note: 'Beschikbare studietijd, geen voorspelling van benodigde leertijd. Plan zelf pauzes en controleer je deadline in Brightspace.' };
    });
    const news = trackedTool('technology_news', 'Optioneel: zoek actuele Nederlandse technologievoorbeelden bij taalmodellen en agents. Alleen gebruiken als de student expliciet om een actueel praktijkvoorbeeld of nieuws vraagt. Nieuws bepaalt nooit cursusvereisten.', z.object({ category: z.enum(['technology', 'science']) }), async ({ category }, context) => {
        if (!process.env.NEWSDATA_API?.trim() || process.env.NEWSDATA_API.startsWith('vul-')) return { error: 'NEWSDATA_API ontbreekt. Er is geen live nieuws opgehaald.' };
        const url = new URL('https://newsdata.io/api/1/news');
        url.search = new URLSearchParams({ apikey: process.env.NEWSDATA_API, country: 'nl', language: 'nl', category }).toString();
        const data = await getJson(url, { request, signal: context.signal });
        if (data.error) return data;
        if (data.status !== 'success' || !Array.isArray(data.results)) return { error: 'NewsData gaf geen geldig resultaat.' };
        const articles = data.results.filter(item => item?.title && item?.description && httpUrl(item.link) && item.pubDate).slice(0, 3).map((item, index) => ({ id: 'news-' + index + '-' + context.events.length, title: String(item.title).slice(0,250), text: String(item.description).slice(0,1000), date: String(item.pubDate).slice(0,80), publisher: String(item.source_name || item.source_id || '').slice(0,120), url: httpUrl(item.link) }));
        return articles.length ? { summary: articles.length + ' praktijkvoorbeelden opgehaald.', articles, sources: articles.map(item => ({ ...item, kind: 'news' })) } : { error: 'Geen bruikbare nieuwsberichten gevonden.' };
    });
    return [currentDate, plan, news];
}
