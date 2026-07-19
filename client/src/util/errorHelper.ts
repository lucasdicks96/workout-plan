import axios from "axios";

/**
 * Entpackt sicher die Fehlermeldung aus jedem API- oder JavaScript-Fehler.
 */
export function getApiErrorMessage(
  error: unknown,
  fallbackMessage = "Ein Fehler ist aufgetreten",
): string {
  if (axios.isAxiosError(error)) {
    // Greift zielgenau auf deine flache Express/Zod-Message zu
    return error.response?.data?.message || fallbackMessage;
  }
  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }
  return fallbackMessage;
}
