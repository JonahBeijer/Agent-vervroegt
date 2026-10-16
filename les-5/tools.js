import { z } from 'zod';
import { trackedTool, getJson, httpUrl } from './context.js';
const short = (value, max = 1200) => typeof value === 'string' ? value.slice(0, max) : '';
export function createTools({ request = fetch, clock = () => new Date() } = {}) {
    const currentDate = trackedTool('current_date', 'Haal de huidige datum en tijd in Nederland op als de gebruiker naar vandaag of actualiteit vraagt.', z.object({}), async () => ({ date: clock().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' }), summary: 'Huidige datum en tijd opgehaald.' }));
    const news = trackedTool('find_news', 'Haal Nederlands technologie- of wetenschapsnieuws op als vertrekpunt voor anime. Gebruik deze tool voor actuele nieuwsclaims. Geen sport- of oorlogsnieuws.', z.object({ category: z.enum(['technology', 'science']) }), async ({ category }, context) => {
        if (!process.env.NEWSDATA_API?.trim() || process.env.NEWSDATA_API.startsWith('vul-')) return { error: 'NEWSDATA_API ontbreekt. Vraag om een artikel met bron en datum; verzin geen nieuws.' };
        const url = new URL('https://newsdata.io/api/1/news');
        url.search = new URLSearchParams({ apikey: process.env.NEWSDATA_API, country: 'nl', language: 'nl', category }).toString();
        const data = await getJson(url, { request, signal: context.signal });
        if (data.error) return data;
        if (data.status !== 'success' || !Array.isArray(data.results)) return { error: 'NewsData gaf geen geldig resultaat.' };
        const articles = data.results.filter(item => item?.title && item?.description && httpUrl(item.link) && item.pubDate).slice(0, 3).map((item, index) => ({ id: 'news-' + index + '-' + context.events.length, title: short(item.title, 250), text: short(item.description), date: short(item.pubDate, 80), publisher: short(item.source_name || item.source_id, 120), url: httpUrl(item.link) }));
        return articles.length ? { summary: articles.length + ' nieuwsberichten opgehaald.', articles, sources: articles.map(item => ({ ...item, kind: 'news' })) } : { error: 'Geen bruikbare nieuwsberichten gevonden. Vraag om een ander artikel.' };
    });
    const anime = trackedTool('search_anime', 'Zoek bestaande anime in de Jikan/MyAnimeList-catalogus. Controleer iedere aanbevolen titel hiermee. Zoek op de officiële titel in het Engels/Japans; verzin geen titels als er geen match is. Resultaten zijn catalogusdata, geen bewijs voor de nieuwsinterpretatie.', z.object({ query: z.string().min(2).max(90) }), async ({ query }, context) => {
        const url = new URL('https://api.jikan.moe/v4/anime');
        url.search = new URLSearchParams({ q: query, limit: '3', sfw: 'true' }).toString();
        const data = await getJson(url, { request, signal: context.signal });
        if (data.error) return data;
        if (!Array.isArray(data.data)) return { error: 'De animecatalogus gaf geen geldig resultaat.' };
        const anime = data.data.filter(item => item?.mal_id && item.title && httpUrl(item.url)).map(item => ({
            id: String(item.mal_id), title: short(item.title_english || item.title, 200), originalTitle: short(item.title, 200), url: httpUrl(item.url),
            image: httpUrl(item.images?.webp?.image_url || item.images?.jpg?.image_url), synopsis: short(item.synopsis, 900), episodes: item.episodes || null,
            status: short(item.status, 100), year: item.year || item.aired?.prop?.from?.year || null, genres: (item.genres || []).map(item => item.name).slice(0, 5),
        }));
        return { summary: anime.length + ' catalogusresultaten gevonden.', anime, sources: anime.map(item => ({ id: 'anime-' + item.id, kind: 'catalogue', title: item.title, url: item.url })) };
    });
    return [news, anime, currentDate];
}
