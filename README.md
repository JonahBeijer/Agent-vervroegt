# Agent vervroegt

Aparte repository voor opdracht 2 van CMTPRG02-8 Smart Technologies: een agent bouwen op basis van lessen 5 t/m 8.

## Status

De projectbasis is aangemaakt. Er is nog geen werkende agent, webinterface, documentzoekfunctie of deployment. De agent-use-case wordt eerst concreet uitgewerkt. Het eerdere project Taalmodel-vervroegt blijft apart.

## Voorbereiden

Gebruik Node.js 24 of hoger en Git.

~~~sh
git clone https://github.com/JonahBeijer/Agent-vervroegt.git
cd Agent-vervroegt
npm install
~~~

Er is nog geen startcommando: dat wordt toegevoegd bij de implementatie van les 5. Er zijn nog geen runtime-dependencies geïnstalleerd.

Bewaar echte API-sleutels buiten de repository, bijvoorbeeld in ../agent-vervroegt-secrets/azure.env. De voorbeeldvelden staan in .env.example; de toekomstige server moet dit externe configuratiebestand expliciet laden.

## Lessen

| Les | Onderwerp | Status |
| --- | --- | --- |
| 5 | Agent met tools; agent kiest wanneer een tool nodig is | Nog te bouwen |
| 6 | Frontend, checkpointer memory en gescheiden gesprekken | Nog te bouwen |
| 7 | Documenten laden, splitsen, embedden en doorzoeken | Nog te bouwen |
| 8 | Document search als agenttool, bronnen en oplevering | Nog te bouwen |

Iedere les krijgt een eigen branch les-N en map les-N/. Start les 5 vanaf main; volgende lessen bouwen verder op de vorige les.

## Inlevering voorbereiden

Werk eerst de eigen agent-use-case uit. Verzamel tijdens het bouwen echte testresultaten en leg uit wanneer de agent wel en geen tools gebruikt. Controleer de definitieve beoordelingscriteria en inlevervoorwaarden in Brightspace.

Overzicht van het aangeleverde cursusmateriaal: [docs/lesmateriaal.md](docs/lesmateriaal.md).

## AI-hulp

Deze projectbasis is met Codex aangemaakt op verzoek van Jonah. Er zijn geen modelresultaten, gebruikerstests of studentreflecties verzonnen. Bewaar chatlogs en licht je eigen bijdrage toe volgens de cursusvoorwaarden.
