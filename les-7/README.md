# Les 7 — Documenten, embeddings en opgeslagen vectors

PDF, TXT, Markdown en de HTML-pagina's uit de cursus worden lokaal gelezen. PDF-paginanummers blijven gekoppeld aan tekstfragmenten van maximaal 950 tekens met 130 tekens overlap. Voor tekstbestanden worden secties gebruikt, geen fictieve PDF-pagina's.

LocalEmbeddings gebruikt het echte meertalige multilingual-e5-small-model (384 dimensies, q8) via Transformers.js. De eerste keer wordt het model gedownload naar data/models/. Er is geen extra Azure embedding-deployment nodig. Dit is een bewust alternatief voor de Azure-embeddings/FAISS-combinatie uit het lesvoorbeeld.

De vectorstore is een opgeslagen SQLite-tabel met vectors en documentmetadata. Zoeken berekent echte cosinusgelijkenis. Dit is exact zoeken, geschikt voor deze kleine cursuscollectie; voor grote verzamelingen is een gespecialiseerde index nodig.

Start: npm run import:course (de vier aangeleverde ZIP's in Downloads), of npm run index -- pad/document.pdf.
Data en lesbestanden blijven lokaal in de genegeerde data/-map en worden niet naar GitHub gekopieerd.
