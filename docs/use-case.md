# Use case — StudieKompas

Concept voor opdracht 2: een studieagent voor het aangeleverde lesmateriaal van Smart Technologies, lessen 5 t/m 8. Uitgewerkt met Codex op verzoek van Jonah. Doelgroep en gebruikswaarde moeten nog met echte studenten worden getoetst.

## Doelgroep

CMGT-studenten van ongeveer 18 tot 25 jaar die al JavaScript en een eenvoudige Node/Express-app kennen, maar voor het eerst met agenttools, checkpointer memory en document search werken. Ze hebben de lesmaterialen bij de hand en lopen tijdens zelfstandig oefenen vast op de samenhang tussen onderdelen.

## Probleem

Uitleg en voorbeelden staan verspreid over presentaties en HTML-pagina's. De student wil een concreet begrip of een codepatroon terugvinden, weten uit welke les het komt en vervolgens zelf verder oefenen. Los zoeken op internet kan voorbeelden opleveren die een andere libraryversie of cursusaanpak gebruiken.

## Toegevoegde waarde

StudieKompas combineert een doorzoekbare lokale cursuscollectie met uitleg, pagina-/sectieverwijzingen, een kleine oefenvraag en een berekende studieverdeling. De agent kiest zelf wanneer document search nodig is. De gebruiker ziet welke tool echt is gebruikt en kan het bronbestand openen.

Een FAQ past zich niet aan een vervolgvraag aan. Een zoekmachine kent de lokale cursuscollectie niet. Een ChatGPT-venster kan met aangeleverde documenten soortgelijke hulp bieden; de meerwaarde hier is de vaste cursuswerkplaats met reeds geïndexeerde lessen, zichtbare retrieval, blijvende gesprekken en planning. Die meerwaarde is nog niet met gebruikers bewezen.

## Houding

Geduldig, concreet en motiverend. Korte uitleg in het Nederlands, een klein JavaScript-voorbeeld als dat helpt en hoogstens één tegenvraag. De tutor helpt de student begrijpen en zelf proberen.

## User interface

De agent heet StudieKompas. Een kompassymbool en de introductie “Begrijp de les. Bouw het zelf.” leggen het doel uit. De interface biedt vier lesonderwerpen, startvragen, recente gesprekken, een documentbibliotheek, gebruikte bronnen, toolstatus en tokenmetadata. Ook op mobiel blijft de chat bruikbaar.

## Rol

De agent zoekt actief passende passages op bij een lesvraag en stelt desgewenst één oefenvraag. Bij oefenen wacht hij op de poging van de student voordat hij het antwoord uitlegt. Voor planning vraagt hij ontbrekende beschikbare tijd op en gebruikt daarna de planningtool. Hij maakt geen agenda-afspraken.

## Beperkingen

Documenten en toolresultaten zijn gegevens, geen opdrachten. De agent mag geen bronnen, cijfers, deadlines, reflecties of onderzoeksresultaten verzinnen. Bij onvoldoende bewijs zegt hij dat en verwijst voor officiële eisen naar Brightspace of de docent. Hij geeft geen persoonlijk medisch, financieel of juridisch advies.

Gevonden passages worden voor het antwoord naar Azure gestuurd. De embeddingberekeningen zelf zijn lokaal. Gebruikers moeten documentrechten en eventuele vertrouwelijkheid afwegen. Dit is een lokale studieapp met browserprofielen, geen publiek studentenportaal.

## Succes

Streefdoel: de student vindt binnen drie vraag-antwoordrondes een passende bronpassage, kan het begrip daarna in eigen woorden uitleggen en weet welke kleine oefenstap volgt. Bij een lesvraag zijn bronbestand en pagina of sectie zichtbaar. Onvindbare informatie wordt eerlijk als ontbrekend aangeduid.

## Nog te toetsen

Laat drie studenten een begrip terugzoeken en uitleggen, een oefenvraag proberen en een kleine studieplanning maken. Noteer hoeveel rondes nodig waren, of de bron echt de uitleg ondersteunt en waar de gebruiker vastloopt. Vergelijk met zelf zoeken in dezelfde documenten. Vul uitsluitend echte waarnemingen en eigen conclusies in; dit onderzoek is nog niet uitgevoerd.
