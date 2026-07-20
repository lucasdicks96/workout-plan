import app from "./index";

/**
 * Der Port, auf dem der HTTP-Server lauscht.
 * Liest die Umgebungsvariable `PORT` aus oder verwendet standardmäßig Port `5000`.
 */
const port = parseInt(process.env.PORT || "5000");

/**
 * Startet den Express-HTTP-Server und bindet ihn an alle verfügbaren
 * Netzwerk-Schnittstellen (`0.0.0.0`), damit er auch innerhalb von 
 * Docker-Containern oder über das lokale Netzwerk erreichbar ist.
 */
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is listening on port ${port}`);
});