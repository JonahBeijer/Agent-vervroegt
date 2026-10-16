# Les 8 — StudieKompas samenbrengen

De agent gebruikt search_documents als echte tool: de modelbeslissing veroorzaakt retrieval, de gevonden tekst wordt een ToolMessage en het volgende modelantwoord gebruikt die context. De interface toont toolstatus en originele bronnen; er wordt geen intern denkproces getoond.

Start: npm start. Open http://localhost:3001/.
Console: npm run agent -- "Hoe werkt MemorySaver volgens les 6?"

De checkpointer bewaart model- en toolberichten in SQLite per gesprek. Een HttpOnly-cookie koppelt de browser aan een eigen serverprofiel; andere gebruikers kunnen geen thread selecteren of persoonlijke documenten downloaden. Dit is een lokale browseridentiteit, geen accountlogin voor publieke hosting.

Documenten en vectors staan lokaal. Gevonden passages gaan bij een agentaanroep naar Azure. De voorbeeldinstellingen bevatten geen echte sleutels. Hosting is voorbereid door een configureerbare PORT, maar er is nog geen publieke deployment gedaan.
