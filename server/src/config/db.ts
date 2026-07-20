import dotenv from "dotenv";
import pg, { PoolConfig } from "pg";
import path from "path";
import fs from "fs";

/** Prüft, ob sich die Anwendung im automatisierten Testmodus befindet. */
const isTest = process.env.NODE_ENV === "test";

/** Bestimmt die zu ladende Umgebungsvariablen-Datei (.env.test im Testmodus, ansonsten .env). */
const envFile = isTest ? ".env.test" : ".env";

/** Der absolute Pfad zur Ermittlung der Konfigurationsdatei. */
const envPath = path.resolve(process.cwd(), envFile);

// 1. SCHUTZSCHICHT: Im Testmodus MUSS die .env.test physisch existieren
if (isTest && !fs.existsSync(envPath)) {
  throw new Error(
    `🛑 FATAL: NODE_ENV ist 'test', aber die Datei "${envPath}" wurde nicht gefunden! Abbruch, um Fallback auf Live-Daten zu verhindern.`,
  );
}

dotenv.config({ path: envPath });

// 2. SCHUTZSCHICHT: Im Testmodus muss der DB-Name explizit als Test-DB erkennbar sein
const dbName = process.env.PG_DATABASE || "";
const dbUrl = process.env.DATABASE_URL || "";

if (isTest && !dbName.endsWith("_test") && !dbUrl.includes("_test")) {
  throw new Error(
    `🛑 FATAL: Testmodus aktiv, aber Zieldatenbank schützt nicht vor Datenverlust! Name/URL: "${dbName || dbUrl}". Erwarte "_test" im Namen.`,
  );
}

/**
 * Hybride Datenbank-Konfiguration (PoolConfig) für den PostgreSQL-Pool und Rate-Limiter.
 *
 * Unterstützt zwei Betriebsmodi:
 * - Weg 1: Produktion / Docker (verwendet einen vollständigen `DATABASE_URL`-Connection-String).
 * - Weg 2: Lokale Entwicklung / Tests (greift auf einzelne `PG_*`-Umgebungsvariablen zurück).
 */
export const dbConfig: PoolConfig = process.env.DATABASE_URL
  ? {
      // Weg 1: Produktion / Docker (Nutzt den kompletten Connection-String)
      connectionString: process.env.DATABASE_URL,
    }
  : {
      // Weg 2: Lokale Entwicklung / Tests (Fällt auf Einzelvariablen zurück)
      user: process.env.PG_USER,
      host: process.env.PG_HOST,
      database: process.env.PG_DATABASE,
      password: process.env.PG_PASSWORD,
      port: parseInt(process.env.PG_PORT || "5432", 10),
    };

/** Der zentrale PostgreSQL-Verbindungspool (Connection Pool) der Anwendung. */
const pool = new pg.Pool(dbConfig);

pool.on("connect", () => {
  console.log(
    `[DB] Erfolgreich verbunden. Modus: ${process.env.DATABASE_URL ? "URL" : "Variablen"}`,
  );
});

export default pool;
