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

## NovaAI en rubriccontrole — 9 november 2026

Uitgevoerd door Codex; technische controles, geen studentonderzoek of Brightspace-inlevering.

- De agent hergebruikt standaard ../taalmodel-vervroegt-secrets/nova.env. NovaAI gemma4:26b is daadwerkelijk ingesteld; de sleutel is niet naar de repository gekopieerd. AGENT_ENV_FILE blijft een expliciete override.
- RecursiveCharacterTextSplitter uit @langchain/textsplitters is geïntegreerd in documentimport. LocalEmbeddings blijft de LangChain Embeddings-interface gebruiken. Echte lokale testvectoren hadden 384 dimensies.
- npm run verify:rubric controleert de daadwerkelijke SQLite-bibliotheek: 19 documenten, 58 PDF-pagina’s in de bronbestanden en 110 chunks. Ook het aantal PDF-pagina’s met daadwerkelijk opgeslagen tekst wordt geteld en moet minstens tien zijn.
- Lokale zoekcontrole zonder lesfilter: MemorySaver/thread_id vindt les 6 (PDF-pagina 11 als eerste hit); embeddings/vector database vindt les 7; document search tool agent vindt les 8. Geen cursuspassages zijn tijdens deze audit naar NovaAI gestuurd.
- Echte NovaAI-agentcontrole: make_study_plan is door het model aangeroepen en succesvol uitgevoerd voor drie dagen van twee uur. Technology_news is door het model aangeroepen, gebruikte de bestaande NEWSDATA_API en gaf echte nieuwsbronmetadata terug. Dit bewijst tooluitvoering, niet dat elk nieuwsbericht inhoudelijk bij de cursus past of dat de samenvatting foutloos is.
- Een geïsoleerde HTTP-controle met een expliciet fictief testdocument riep daadwerkelijk search_documents aan. Het antwoord noemde de juiste testcode KOMPAS-731 en de juiste testbestandsnaam/sectie. De bron kwam in de response terug. Het gesprek werd opgeslagen, terwijl een andere cookiesessie leeg bleef. De tijdelijke testdatabase is opgeruimd.
- De regressietests controleren ook dat checkpoints en opgeslagen gesprekken een herstart overleven en van elkaar gescheiden blijven. Deze geautomatiseerde agenttests gebruiken herkenbaar fictieve modeldata; ze zijn geen extra live modelmetingen.
- De privacytekst en verbindingsstatus zijn providerneutraal gemaakt. De Node-agent toont toolnaam, invoer, status en bronmetadata als controleerbaar bewijs.
- npm audit fix heeft twee compatibele dependency-updates uitgevoerd; daarna rapporteerde npm audit nul kwetsbaarheden.

De vorige secties beschrijven historische Azure-controles. De standaardprovider is nu NovaAI. De eerder genoemde beperking dat live nieuws nog niet gecontroleerd was, is voor bovenstaande NovaAI-controle opgeheven.

## Compacte zijpanelen — 10 november 2026

De zijpanelen bevatten nu alleen gesprekken met Nieuw gesprek, een compact uitklapbaar documentenoverzicht met bronbestandlinks, gebruikte bronnen en toolactiviteiten. Lesnavigatie, verbindingsstatus, export, upload/verwijderknoppen en de gezamenlijke token-/rondeteller zijn verwijderd uit deze panelen. Documentimport via Node en de bestaande opslag blijven werken. Tokenmetadata bij individuele chatberichten staat buiten het zijpaneel.

Controle: alle 19 bestaande tests geslaagd. Browsercontrole met expliciet fictieve gegevens: berichten versturen, knoppen uitgeschakeld tijdens verwerking, documentlijst uitklappen, bronkaart en toolactiviteit tonen, nieuw gesprek, terugschakelen en herladen van geschiedenis. Geen console-errors waargenomen. Hiervoor zijn geen externe modelaanvragen gedaan.
