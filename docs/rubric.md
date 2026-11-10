# Controle van de beoordelingspunten

Dit overzicht beschrijft de implementatie en controles, niet een toegekend cijfer. Niveaus tellen binnen één onderdeel niet op. De docent beoordeelt de werking en je eigen uitleg.

## Document search — maximaal 50

| Niveau | Implementatie | Demonstratie |
| --- | --- | --- |
| 10 | les-7/library.js gebruikt LangChains RecursiveCharacterTextSplitter; les-7/embeddings.js implementeert LangChain Embeddings met echte lokale E5-vectoren. | npm run verify:rubric toont splitsing en vectorlengte 384. Upload een relevant document om de volledige import te tonen. |
| 30 | SQLite bewaart chunks, vectoren, documentnamen en pagina’s. search_documents zoekt relevante passages via cosinusgelijkenis. | Stel in de frontend een lesvraag en toon de gebruikte documenttool en bronnen. |
| 40 | De lokale bibliotheek bevat meerdere documenten en ruim tien opgeslagen pagina’s. De Node-controle toetst aantallen en verwacht documenten uit les 6/7/8 bij gerichte queries. | npm run verify:rubric; laat bestandsnaam, PDF-pagina/sectie en similarity zien. |
| 50 | De API retourneert geraadpleegde bronnen. De interface toont bronkaarten met bestandsnaam, pagina/sectie, passage en documentlink. | Vraag naar MemorySaver en thread_id volgens les 6; controleer de tekst van de bron tegen het antwoord. |

## Werken met tools — maximaal 50

| Niveau | Implementatie | Demonstratie / open punt |
| --- | --- | --- |
| 10 | LangChain createAgent en current_date/make_study_plan werken vanuit Node. | npm run agent met een planningsvraag. Use Case Agent moet ook daadwerkelijk in Brightspace zijn ingeleverd; dit is niet gecontroleerd. |
| 30 | Express-frontend roept de agent aan. technology_news gebruikt NEWSDATA_API uit ENV. SYSTEM legt het gebruik uit en beperkt nieuws tot expliciete actuele praktijkvragen. | Vraag om een actueel technologiebericht; toon technology_news done. Alleen een NovaAI-modelkey bewijst deze tool-eis niet. |
| 40 | Vier tools: search_documents, current_date, make_study_plan, technology_news. SqliteSaver bewaart checkpoints per thread_id. Node logt toolnaam/status en de CLI toont invoer en resultaatstatus. | Laat meerdere soorten vragen zien, controleer toolargumenten en leg de checkpointer uit. npm test controleert tooluitvoering en herstart. |
| 50 | SQLite bewaart gesprekken per eigenaar en thread. Een HttpOnly-cookie selecteert het browserprofiel; checkpoints en de zichtbare geschiedenis blijven na herstart bestaan. | Voer een gesprek, herstart de server en toon herstel. Gebruik een privévenster om gescheiden geschiedenis te tonen. Dit is geen accountlogin. |

## Starten en controleren

~~~powershell
cd C:\Users\jonah\Agent-vervroegt
npm test
npm run verify:rubric
npm start
~~~

Open http://localhost:3001/. Stop een al draaiende oude server eerst met Ctrl+C, anders blijft die de oude configuratie gebruiken of ontstaat EADDRINUSE.

De standaardconfiguratie hergebruikt ../taalmodel-vervroegt-secrets/nova.env. Echte credentials blijven buiten Git. De documenten/vectoren in data/ staan bewust ook niet op GitHub: op een andere computer is import opnieuw nodig. Je moet de screencast, eigen toelichting en Brightspace-inzending zelf afronden. Zie controle.md voor de werkelijk uitgevoerde controles en het onderscheid tussen echte NovaAI-aanvragen en geautomatiseerde fictieve tests.
