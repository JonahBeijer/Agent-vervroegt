# Technische controle — 16 oktober 2026

Uitgevoerd met Codex op verzoek van Jonah. Dit is een technisch verslag, geen persoonlijke studentreflectie.

## Werkelijk gecontroleerd

- 16 geautomatiseerde tests geslaagd, 0 mislukt.
- Echte LangChain-agentloop met expliciete fictieve modeldata: toolkeuze leidt tot echte documentretrieval; bronmetadata en werkelijk gerapporteerde testtokenmetadata worden opgeslagen.
- SqliteSaver-geheugen overleeft herstart; andere browserprofielen en nieuwe gesprekken hebben een andere context.
- Een afgebroken length-response verandert de eerder geslaagde geschiedenis niet; beschikbare tokens blijven in de foutmelding aanwezig.
- Documenten en vectors worden persistent opgeslagen. Persoonlijke documenten zijn voor andere profielen niet zichtbaar, niet downloadbaar en niet verwijderbaar.
- Upload, jobstatus, ongeldig request, cross-site blokkering, gelijktijdige mutaties en de limiet van zes vragen per minuut getest.
- De echte lokale multilingual-e5-small-embeddings leveren 384 eindige dimensies op. Er zijn geen vervangende zoekvectoren in de productiecode.
- De vier aangeleverde archieven zijn lokaal geïndexeerd: 19 documenten, 58 PDF-pagina's en 110 fragmenten. Echte lokale retrieval voor MemorySaver/thread_id vindt onder meer les 6, PDF-pagina 11.
- Browsercontrole met expliciet fictieve data: bericht verzenden, knoppen tijdens wachten uitgeschakeld, echte toolstatus, Markdown, bronweergave en herstel bij herladen. Mobiele controle op circa 390 pixels toont geen horizontale overflow. Geen console-errors gevonden.
- npm audit --omit=dev: 0 bekende kwetsbaarheden.

## Eén toegestane echte Azure-controle

De eerste poging om de complete documentvraag uit te voeren is door automatische goedkeuringscontrole tegengehouden wegens de overdracht van privé aangeleverd lesmateriaal. Vervolgens is de gebruiker expliciet gevraagd om één test met maximaal vier fragmenten van elk maximaal 950 tekens. De gebruiker heeft dat toegestaan.

De controle gebruikte alleen de vooraf geselecteerde vier les-6-fragmenten; extra retrieval kon geen andere passages opleveren. Vraag: “Hoe werken MemorySaver en thread_id volgens les 6?”

Resultaat: geslaagd. De agent koos search_documents, die werd echt uitgevoerd. Het antwoord verwees onder meer naar Les 6 - PRG08-2026-LES6.pdf, pagina 11, en de Agent Chat History HTML. Gemeten: 3.554 inputtokens, 1.203 outputtokens, 4.757 totaal. De volledige testuitvoer staat uitsluitend lokaal in data/authorized-live-test.json.

Een eerdere algemene Azure-begroeting zonder cursuspassages gaf een echt antwoord zonder tools. Deze controles bewijzen niet dat alle toekomstige uitleg, citaties of oefenvragen correct zijn.

## Technische keuzes en nog te doen

- Lokale meertalige transformer-embeddings en een persistente SQLite-vectorstore zijn een alternatief voor de Azure-embeddings/FAISS-combinatie uit de lessen. De bestaande configuratie bevat geen embedding-deployment. Het verschil moet in de screencast worden uitgelegd.
- SqliteSaver is de duurzame checkpointer; de app gebruikt geen gefingeerde history.
- Tokenmetadata verschijnt per antwoord; totalen van opgeslagen gesprekken zijn geen volledige factuurmeting.
- De nieuws-API-tool is aanwezig en vereist NEWSDATA_API. De daadwerkelijke agentkeuze voor die optionele tool en een succesvolle live nieuwsronde zijn niet in deze controle uitgevoerd.
- Geen openbare deployment, screencast, Brightspace-inlevering of gebruikersonderzoek uitgevoerd. Deze onderdelen zijn niet verzonnen.
