# Les 5 — Agent met tools

De echte LangChain createAgent-loop bepaalt zelf of find_news, search_anime of current_date nodig is. Tooluitvoer wordt als ToolMessage teruggegeven aan het model; de uiteindelijke reactie is het laatste AIMessage.

Start: npm run agent -- "Zoek Planetes in de catalogus."
Configuratie: extern env-bestand via AGENT_ENV_FILE, zie hoofd-README.
Tools houden geen gebruikersdata in globale variabelen bij. AsyncLocalStorage levert uitsluitend de context van de huidige serveraanvraag. Sleutels en ruwe providerexceptions worden niet doorgestuurd.

Gecontroleerd: een echte begroeting geeft een antwoord zonder toolaanroepen. De geautomatiseerde tooltests gebruiken expliciete fictieve API-data. De andere lessen voegen geheugen, documenten en de webinterface toe.
