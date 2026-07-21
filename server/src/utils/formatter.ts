// utils/formatters.ts

/**
 * Bereinigt und normalisiert eine E-Mail-Adresse für den sicheren Datenbank- und App-Einsatz.
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  return email
    .trim()                           // 1. Leerzeichen vorne/hinten entfernen
    .toLowerCase()                    // 2. In Kleinbuchstaben umwandeln
    .normalize("NFC")                 // 3. Unicode-Codierung vereinheitlichen
    .replace(/ß/g, "ss")              // 4. ß zu ss
    .replace(/ä/g, "ae")              // 5. Umlaute ersetzen
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue");
}