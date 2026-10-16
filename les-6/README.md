# Les 6 — Chat, gebruikers en duurzaam geheugen

De Express-server en browserinterface staan hier. SqliteSaver bewaart de volledige agentcontext inclusief toolberichten. Een onvoorspelbare HttpOnly-cookie koppelt een browser aan een serverprofiel. Ieder gesprek krijgt een eigen thread_id.

De uiteindelijke runtime in les 8 verbindt deze server met de documentbibliotheek. Start de complete versie met npm start op main of les-8. De les-6-modules zijn ook los met een geïnjecteerde service te testen.

De interface toont echte toolstatus via een NDJSON-stream; antwoordtekst verschijnt als het model klaar is. Er is geen nagebootste tokenstream. Markdown wordt met micromark gerenderd en met DOMPurify opgeschoond.

Getest: gescheiden gesprekken, herstartbestendig geheugen, foutrollback, gelijktijdige mutaties, maximale promptlengte en aanvraaglimiet.
