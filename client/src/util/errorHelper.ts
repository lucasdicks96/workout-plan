import axios from "axios";

/**
 * Entpackt und extrahiert sicher eine aussagekräftige Fehlermeldung aus 
 * verschiedenen Fehlertypen (Axios-API-Antworten, Standard-JavaScript-Errors oder unbekannte Typen).
 *
 * @param {unknown} error - Das abgefangene Fehlerobjekt (typischerweise aus einem `catch`-Block).
 * @param {string} [fallbackMessage="Ein Fehler ist aufgetreten"] - Die Standardnachricht, falls keine spezifische Meldung gefunden wird.
 * @returns {string} Die ermittelte Fehlermeldung als Textstring.
 */
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "Ein Fehler ist aufgetreten",
): string {
  if (axios.isAxiosError(error)) {
    // Greift zielgenau auf die strukturierte Express/Zod-Fehlermeldung der API-Antwort zu
    return error.response?.data?.message || fallbackMessage;
  }
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }
  return fallbackMessage;
}