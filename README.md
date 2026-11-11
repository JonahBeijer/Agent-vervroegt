# Agent vervroegt — StudieKompas

Een studieagent voor CMGT Smart Technologies, lessen 5 t/m 8. StudieKompas helpt lesstof begrijpen, oefenvragen maken en beschikbare studietijd verdelen. Bij cursusvragen zoekt de agent in de echte documenten en toont de bronbestanden en PDF-pagina's.

## Starten

Gebruik Node.js 24 en Git. De app draait lokaal met Express; er is geen aparte frontendbuild.

~~~sh
git clone https://github.com/JonahBeijer/Agent-vervroegt.git
cd Agent-vervroegt
npm ci
npm start
~~~

Open http://localhost:3001/. Kies een startvraag of typ je eigen vraag. Tijdens de aanvraag zie je welke tools werkelijk worden uitgevoerd. Met Stop breek je de aanvraag af. Gesprekken zijn per browserprofiel gescheiden en blijven na een serverherstart bestaan.

## Configuratie

Bewaar echte sleutels buiten de repository, in hetzelfde ../taalmodel-vervroegt-secrets/nova.env als Taalmodel-vervroegt. Gebruik .env.example uitsluitend als overzicht van veldnamen.

~~~powershell
$env:AGENT_ENV_FILE = 'C:/pad/naar/taalmodel-vervroegt-secrets/nova.env'
npm start
~~~

De loader probeert achtereenvolgens AGENT_ENV_FILE, ../agent-vervroegt-secrets/nova.env, ../taalmodel-vervroegt-secrets/nova.env en daarna de bestaande Azure-configuraties. De standaard hergebruikt NovaAI van Taalmodel-vervroegt. De laatste twee opties hergebruiken de bestaande configuratie van opdracht 1; er worden geen sleutels naar deze repository gekopieerd.

Voor NovaAI vereist: NOVA_API_KEY; NOVA_MODEL en NOVA_BASE_URL zijn optioneel. Alleen bij LLM_PROVIDER=azure zijn AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_INSTANCE_NAME, AZURE_OPENAI_API_DEPLOYMENT_NAME en AZURE_OPENAI_API_VERSION vereist. Stel AZURE_OPENAI_MODEL_NAME in als de deployment een eigen alias heeft. Voor gpt-5-nano wordt low reasoning gebruikt met ruimte voor interne redeneertokens en het antwoord. NEWSDATA_API is optioneel voor actuele praktijkvoorbeelden.

De server luistert alleen op 127.0.0.1. Met PORT wijzig je de poort. Publicatie vereist een passende eigen providerconfiguratie en een beoordeling van toegang tot de cursusbestanden; er is geen publieke deployment uitgevoerd.

## Lesmateriaal importeren

Op een nieuwe checkout:

~~~sh
npm run import:course
~~~

Dit zoekt de vier Smart Technologies-archieven van 16 oktober 2026 in jouw Downloads-map. Geef andere ZIP-paden expliciet mee wanneer nodig:

~~~sh
npm run import:course -- "C:/pad/les5.zip" "C:/pad/les6.zip" "C:/pad/les7.zip" "C:/pad/les8.zip"
npm run index -- "C:/pad/eigen-document.pdf"
~~~

De standaardvolgorde is les 5, 6, 7, 8. Herhaald importeren van dezelfde bron maakt geen dubbele documenten. Het compacte documentenoverzicht toont de beschikbare bestanden en downloadlinks. Extra documenten voeg je toe met npm run index; deze import is voor alle lokale profielen beschikbaar.

De eerste embeddingaanroep downloadt het openbare meertalige E5-small-model. Daarna worden echte vectoren van 384 dimensies lokaal berekend. Er is geen Azure embedding-deployment nodig. Een scan zonder tekstlaag vereist eerst OCR.

## Wat de agent doet

| Tool | Wanneer |
| --- | --- |
| search_documents | Lesvragen: passages zoeken, bestandsnaam en pagina of sectie teruggeven |
| make_study_plan | Beschikbare dagen en uren rekenkundig verdelen over onderwerpen |
| current_date | De echte datum en tijd in Europe/Amsterdam opvragen |
| technology_news | Alleen bij een expliciete vraag naar actuele technologievoorbeelden; gebruikt NEWSDATA_API |

LangChain createAgent kiest zelf of een tool nodig is. De gevonden gegevens worden ToolMessages; de volgende modelstap vormt het antwoord. Een begroeting hoeft geen tool aan te roepen. De interface toont echte toolstatus, geen nagebootst denkproces. De definitieve antwoordtekst verschijnt wanneer het model klaar is; dit is geen streaming van losse modeltokens.

## Geheugen, bronnen en grenzen

- SqliteSaver bewaart de model- en toolcontext per gesprek. Een onvoorspelbare HttpOnly-cookie selecteert je profiel; de browser kan geen willekeurige andere gebruiker kiezen.
- Een tweede gesprek krijgt een nieuw thread_id. Oude gesprekken kunnen opnieuw worden geselecteerd. Maximaal 12 geslaagde rondes per gesprek begrenzen de context.
- De lokale SQLite-vectorstore bewaart tekst, embedding, bestandsnaam en echte PDF-pagina. Bij tekst en HTML verwijzen bronnen naar secties. Voor deze kleine collectie wordt exacte cosinusgelijkenis gebruikt.
- Voor een antwoord gaan gevonden documentpassages naar de ingestelde AI-provider (standaard NovaAI). Gebruik alleen documenten die je hiervoor mag gebruiken.
- Bronkaarten tonen de daadwerkelijk geraadpleegde passages en een downloadlink. Een zoekmatch is geen garantie dat het model iedere claim juist uitlegt.
- Geen verzonnen deadlines, punten, studentreflecties of testresultaten. Officiële eisen blijven bij Brightspace en de docent.
- Geen publieke accountlogin: het browserprofiel is bedoeld voor deze lokale lesapp. Eigen documenten kun je verwijderen; eerdere antwoorden en checkpoints kunnen nog afgeleide informatie bevatten.
- Tokenlabels gebruiken de werkelijk ontvangen metadata. Het gesprekstotaal telt geslaagde opgeslagen rondes; bij een mislukte modelronde worden beschikbare tokens wel in de foutmelding getoond. Het is geen volledige factuurteller.

## Lessen en code

| Les / branch | Implementatie |
| --- | --- |
| les-5 | Configuratie, NovaAI/Azure-model, agentloop en basis-tools |
| les-6 | Express, interface, gesprekken en duurzame checkpointer |
| les-7 | Documenten laden, splitsen, embedden, opslaan en zoeken |
| les-8 | Documenttool en complete applicatie |

main bevat de complete versie. De lesbranches laten de opbouw zien.

~~~sh
npm test
npm run agent -- "Hoe werkt MemorySaver volgens les 6?"
npm run agent:lesson5 -- "Verdeel drie dagen met twee uur over tools en geheugen."
~~~

Technische keuzes en werkelijk uitgevoerde controles: [docs/controle.md](docs/controle.md).
Use case en nog uit te voeren gebruikersonderzoek: [docs/use-case.md](docs/use-case.md).

## Controle voor de beoordelingsrubric

~~~sh
npm run verify:rubric
~~~

Deze lokale Node-controle toont de echte document-, PDF-pagina- en chunkaantallen, zoekt met het lokale embeddingmodel en controleert verwachte lesdocumenten. Er gaan geen cursuspassages naar NovaAI. Documenten worden met LangChains RecursiveCharacterTextSplitter in stukken van maximaal 950 tekens met maximaal 130 tekens overlap gesplitst. LocalEmbeddings implementeert LangChains Embeddings-interface; SQLite bewaart vectoren en metadata en zoekt met cosinusgelijkenis.

Voor een echte agenttooltest zonder cursuspassages:

~~~sh
npm run agent -- "Ik heb drie dagen met twee uur per dag. Verdeel mijn studietijd over tools, geheugen en document search. Gebruik make_study_plan."
npm run agent -- "Zoek via technology_news een actueel Nederlands technologiebericht als praktijkvoorbeeld."
~~~

De tweede test gebruikt NEWSDATA_API uit hetzelfde externe env-bestand. Modelcredentials alleen tellen niet als credentials voor een tool. Controleer de feitelijk gelogde toolstatus en het antwoord; een API-limiet of weigering is geen geslaagde live uitvoering. Brightspace-inlevering van Use Case Agent en de screencast moeten door de student worden afgerond.

Het zijpaneel bevat uitsluitend gesprekken, een compact uitklapbaar documentenoverzicht, gebruikte bronnen en toolactiviteiten. Upload, verwijderen, export, verbindingsstatus, lesnavigatie en de gezamenlijke tokenteller staan niet meer in het zijpaneel. De startvragen en tokenmetadata bij chatberichten blijven beschikbaar.

Bij een incidenteel leeg modelantwoord na een geslaagde technology_news-opvraag toont de agent direct de echte artikelbeschrijvingen met bron, datum en link. De tekst benoemt dat dit bronbeschrijvingen zijn en geen AI-samenvatting. Dit overzicht wordt ook in het checkpoint en de chatgeschiedenis opgeslagen. Voor andere lege modelantwoorden probeert de agent de modelstap maximaal één keer extra per gebruikersvraag. Beschikbare tokenmetadata van die poging telt mee. De bestaande toolresultaten blijven beschikbaar; de herstelcode voert de tools niet zelf opnieuw uit. Als ook herstel leeg blijft, wordt de ronde niet opgeslagen en verschijnt een fout. Zie les-5/empty-response.js en docs/controle.md.
