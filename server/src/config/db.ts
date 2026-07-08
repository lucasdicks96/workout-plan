import dotenv from "dotenv";
import pg from "pg";
import path from "path";

// Lädt lokal entweder .env.test oder .env (wird im Docker-Container ignoriert, 
// da die Variablen dort direkt durch docker-compose injiziert werden)
const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Der hybride Connection-Pool
const pool = new pg.Pool(
  process.env.DATABASE_URL
    ? {
        // Weg 1: Produktion / Docker (Nutzt den kompletten Connection-String)
        connectionString: process.env.DATABASE_URL,
      }
    : {
        // Weg 2: Lokale Entwicklung / Tests (Fällt auf deine alten Variablen zurück)
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: parseInt(process.env.PG_PORT || "5432"),
      }
);

// Optional: Ein kleiner Helfer, um im Server-Log direkt zu sehen, ob die Datenbank da ist
pool.on("connect", () => {
  console.log(`[DB] Erfolgreich verbunden. Modus: ${process.env.DATABASE_URL ? "URL" : "Variablen"}`);
});

export default pool;