# Les 5 — Studieagent met tools

StudieKompas gebruikt een echte LangChain createAgent-loop. De agent kiest zelf of current_date, make_study_plan of technology_news nodig is. Toolresultaten worden ToolMessages, geen gefingeerde antwoorden.

Start: npm run agent -- "Verdeel drie dagen met anderhalf uur per dag over tools, geheugen en documenten."
De documenttool volgt in les 7/8. Nieuws is optioneel en alleen voor actuele praktijkvoorbeelden.

AsyncLocalStorage geeft uitsluitend de context van de huidige serveraanvraag mee. Toolfouten lekken geen API-sleutels. Tests gebruiken expliciete fictieve API-data.
