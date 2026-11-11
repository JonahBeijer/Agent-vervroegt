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

## Lege modelantwoorden — 11 november 2026

De gebruiker meldde EMPTY_ANSWER bij een expliciete nieuwsvraag. Deze melding betekent dat de agent geen afgeronde tekst teruggaf; uit alleen deze foutcode volgt niet of de tool al was uitgevoerd. De exacte nieuwsvraag slaagde bij een nieuwe geïsoleerde live test: technology_news werd uitgevoerd en NovaAI gaf daarna een samenvatting. Het oorspronkelijke incident is dus niet deterministisch gereproduceerd.

Er is gerichte LangChain-middleware toegevoegd voor een leeg tekstantwoord zonder geldige toolcall, bij finish_reason stop of ontbrekende finish_reason. Per gebruikersvraag is maximaal één extra modelaanvraag toegestaan. De bestaande modelstaplimiet blijft vijf; inclusief dit herstel kan maximaal één extra poging plaatsvinden. Tijdslimieten blijven van kracht. Een length-resultaat, andere finish_reason, refusal of afgebroken aanvraag wordt niet opnieuw geprobeerd door deze middleware. Reeds uitgevoerde tools worden door de herstelcode niet opnieuw uitgevoerd; het model krijgt de bestaande context opnieuw aangeboden. Beschikbare tokenmetadata van het weggegooide antwoord telt mee. Er wordt geen vervangend antwoord verzonnen.

Regressiecontrole: 22 tests geslaagd, waaronder herstel vóór/na een tool, tokenregistratie, geen dubbele tooluitvoering in deze testgevallen en blijvende lege uitvoer die stopt en niet wordt opgeslagen. De eerder bestaande herstart-, gebruikersisolatie- en uitvoerlimiettests slagen ook.

Na de wijziging is de exacte nieuwsvraag opnieuw live uitgevoerd: technology_news done, category technology, drie nieuwsbronnen en een afgeronde samenvatting met bron, datum en link. Dit is een echte tool/modelcontrole; de specifieke herstelroute is deterministisch getest met expliciete fictieve modeluitvoer. Veilige foutdiagnostiek toont bij herhaling finish_reason, toolstatus en of herstel is gebruikt, zonder API-sleutels of volledige prompts te loggen.

## Nieuwsresultaten zichtbaar bij een leeg modelantwoord — 11 november 2026

Na de eerdere begrensde herstelpoging meldde de gebruiker opnieuw twee lege NovaAI-antwoorden terwijl technology_news al succesvol was uitgevoerd. Daarom wordt na een geslaagde nieuwsopvraag een leeg stop-antwoord nu direct vervangen door een deterministische weergave van de echte artikelvelden: titel, bronbeschrijving, uitgever, publicatiedatum en link. Dit is expliciet gelabeld als bronbeschrijving, niet als AI-samenvatting. Er worden geen nieuwe feiten of toolresultaten verzonnen. Alleen de laatste nieuwsuitkomst binnen dezelfde aanvraag wordt gebruikt; een mislukte opvraag wist de eventuele eerdere uitkomst.

Een normaal modelantwoord blijft behouden. De bestaande bescherming voor afbreken, refusal, content_filter en length blijft bestaan. Zonder bruikbare nieuwsresultaten wordt geen nieuwsweergave gegenereerd. Het antwoord gaat als AIMessage door de normale checkpoint- en geschiedenisopslag; de werkelijk ontvangen tokenmetadata blijft behouden.

Controles: alle 28 tests geslaagd. Nieuwe tests controleren lege nieuwsuitvoer zonder extra model- of toolaanvraag, bronvelden, veilige Markdown-weergave, herstart en vervolgvraag, normale modeltekst, weigering/uitvoerlimiet en een mislukte nieuwsopvraag zonder verzonnen antwoord.

Een echte HTTP-controle gebruikte NovaAI en NewsData in een tijdelijke database zonder cursusmateriaal. Om exact de foutafhandeling te activeren is de eindtekst van één echte NovaAI-response bewust leeggemaakt in de test. De eerste gebruikersaanvraag leverde alsnog een geldig done-event op met drie nieuwsbronnen en het leesbare nieuwsoverzicht: twee modelaanvragen (toolkeuze en lege eindtekst), één NewsData-opvraag, nul extra herstelpogingen, en succesvol herstel van de opgeslagen chat via de sessie-API. De tijdelijke database is daarna opgeruimd. Dit was een geïnduceerde fouttest en geen claim dat NovaAI tijdens deze controle vanzelf leeg antwoordde.
