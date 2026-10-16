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

Bewaar echte sleutels buiten de repository, bijvoorbeeld in ../agent-vervroegt-secrets/azure.env. Gebruik .env.example uitsluitend als overzicht van veldnamen.

~~~powershell
$env:AGENT_ENV_FILE = 'C:/pad/naar/agent-vervroegt-secrets/azure.env'
npm start
~~~

De loader probeert achtereenvolgens AGENT_ENV_FILE, ../agent-vervroegt-secrets/azure.env, ../taalmodel-vervroegt-secrets/azure.env en ../Taalmodel-vervroegt/azure.env. De laatste twee opties hergebruiken de bestaande configuratie van opdracht 1; er worden geen sleutels naar deze repository gekopieerd.

Vereist: AZURE_OPENAI_API_KEY, AZURE_OPENAI_API_INSTANCE_NAME, AZURE_OPENAI_API_DEPLOYMENT_NAME en AZURE_OPENAI_API_VERSION. Stel AZURE_OPENAI_MODEL_NAME in als de deployment een eigen alias heeft. Voor gpt-5-nano wordt low reasoning gebruikt met ruimte voor interne redeneertokens en het antwoord. NEWSDATA_API is optioneel voor actuele praktijkvoorbeelden.

De server luistert alleen op 127.0.0.1. Met PORT wijzig je de poort. Publicatie vereist een passende eigen providerconfiguratie en een beoordeling van toegang tot de cursusbestanden; er is geen publieke deployment uitgevoerd.

## Lesmateriaal importeren

Op deze computer zijn de vier door Jonah aangeleverde ZIP-bestanden al lokaal geïndexeerd: 19 documenten, samen 58 PDF-pagina's en 110 tekstfragmenten. De bronbestanden, modellen, vectoren en databases staan in data/ en staan niet op GitHub.

Op een nieuwe checkout:

~~~sh
npm run import:course
~~~

Dit zoekt de vier Smart Technologies-archieven van 16 oktober 2026 in jouw Downloads-map. Geef andere ZIP-paden expliciet mee wanneer nodig:

~~~sh
npm run import:course -- "C:/pad/les5.zip" "C:/pad/les6.zip" "C:/pad/les7.zip" "C:/pad/les8.zip"
npm run index -- "C:/pad/eigen-document.pdf"
~~~

De standaardvolgorde is les 5, 6, 7, 8. Herhaald importeren van dezelfde bron maakt geen dubbele documenten. Je kunt eigen PDF-, TXT- en Markdown-bestanden ook via de interface toevoegen. Eigen uploads horen alleen bij jouw browserprofiel; het geïmporteerde lesmateriaal is voor alle lokale profielen beschikbaar.

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
- Voor een antwoord gaan gevonden documentpassages naar de ingestelde Azure OpenAI-dienst. De interface vermeldt dit bij de documentbibliotheek. Gebruik alleen documenten die je hiervoor mag gebruiken.
- Bronkaarten tonen de daadwerkelijk geraadpleegde passages en een downloadlink. Een zoekmatch is geen garantie dat het model iedere claim juist uitlegt.
- Geen verzonnen deadlines, punten, studentreflecties of testresultaten. Officiële eisen blijven bij Brightspace en de docent.
- Geen publieke accountlogin: het browserprofiel is bedoeld voor deze lokale lesapp. Eigen documenten kun je verwijderen; eerdere antwoorden en checkpoints kunnen nog afgeleide informatie bevatten.
- Tokenlabels gebruiken de werkelijk ontvangen metadata. Het gesprekstotaal telt geslaagde opgeslagen rondes; bij een mislukte modelronde worden beschikbare tokens wel in de foutmelding getoond. Het is geen volledige factuurteller.

## Lessen en code

| Les / branch | Implementatie |
| --- | --- |
| les-5 | Configuratie, Azure-model, agentloop en basis-tools |
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

## AI-hulp en inlevering

De implementatie en controles zijn met Codex gemaakt op verzoek van Jonah. Bewaar chatlogs, controleer de uitkomsten, leer de code begrijpen en licht je eigen bijdrage toe volgens de cursusvoorwaarden. Er is geen screencast gemaakt of werk in Brightspace ingeleverd. Gebruikerstests en persoonlijke reflecties moeten nog door jou worden uitgevoerd.

Bronnen: het aangeleverde lesmateriaal; [LangChain agents](https://docs.langchain.com/oss/javascript/langchain/agents), [tools](https://docs.langchain.com/oss/javascript/langchain/tools), [memory](https://docs.langchain.com/oss/javascript/langchain/short-term-memory), [Transformers.js](https://huggingface.co/docs/transformers.js/index) en [NewsData](https://newsdata.io/documentation).
