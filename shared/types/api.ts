/**
 * Repräsentiert den allgemeinen Status einer API-Antwort gemäß dem JSEND-Standard.
 * 
 * - `"success"`: Anfrage war erfolgreich (2xx).
 * - `"fail"`: Vorhersehbarer Client-Fehler oder Validierungsfehler (4xx).
 * - `"error"`: Unerwarteter Server-Fehler oder Systemausfall (5xx).
 */
export type ApiStatus = "success" | "error" | "fail";

/**
 * Repräsentiert eine erfolgreiche API-Antwort (2xx HTTP Status), die Nutzdaten (`data`) zurückgibt.
 * 
 * @template T - Der Typ der enthaltenen Daten im `data`-Feld.
 */
export interface ApiSuccessWithData<T> {
  /** Der Status der erfolgreichen Antwort. */
  status: "success";
  /** Optionale, menschenlesbare Erfolgsmeldung. */
  message?: string;
  /** Die eigentlichen Nutzdaten der API-Antwort. */
  data: T;
}

/**
 * Repräsentiert eine erfolgreiche API-Antwort (2xx HTTP Status) ohne Nutzdaten Payload.
 */
export interface ApiSuccessWithoutData {
  /** Der Status der erfolgreichen Antwort. */
  status: "success";
  /** Optionale, menschenlesbare Erfolgsmeldung. */
  message?: string;
}

/**
 * Repräsentiert eine fehlerhafte API-Antwort bei vorhersehbaren Client-Fehlern 
 * (z. B. Ungültige Formulareingaben, fehlende Felder, 400er HTTP-Fehler).
 */
export interface ApiFailResponse {
  /** Der Status für vorhersehbare Fehlschläge. */
  status: "fail";
  /** Detaillierte Fehlerbeschreibung für den Client. */
  message: string;
  /** Optionale Zusatzdaten zum Fehler (z. B. ein Array von Validierungsfehlern je Feld). */
  data?: any;
}

/**
 * Repräsentiert eine fehlerhafte API-Antwort bei unerwarteten Server-Fehlern 
 * oder internen Ausnahmen (500er HTTP-Fehler).
 */
export interface ApiErrorResponse {
  /** Der Status für interne Serverfehler. */
  status: "error";
  /** Allgemeine Fehlerbeschreibung (im Produktionsmodus meist anonymisiert). */
  message: string;
  /** Optionaler, eindeutiger interner Fehlercode zur Zuordnung (z. B. 'DATABASE_TIMEOUT'). */
  code?: string;
}

/**
 * Bedingter Hilfstyp (Conditional Type) für erfolgreiche API-Antworten.
 * 
 * Unterscheidet automatisch zwischen Antworten mit oder ohne Nutzdaten:
 * - Wenn `T` nicht angegeben oder als `void` deklariert wird, gilt `ApiSuccessWithoutData`.
 * - Wenn ein konkreter Typ `T` übergeben wird, gilt `ApiSuccessWithData<T>`.
 * 
 * @template T - Typ der Nutzdaten oder `void`, falls keine Daten zurückgegeben werden.
 */
export type ApiSuccessResponse<T = void> = T extends void
  ? ApiSuccessWithoutData
  : ApiSuccessWithData<T>;

/**
 * Der universelle Union-Typ für alle API-Antworten des Systems.
 * 
 * Umfasst sowohl erfolgreiche Antworten als auch kontrollierte Fehlschläge (`fail`) 
 * und unerwartete Serverfehler (`error`).
 * 
 * @template T - Typ der erwarteten Nutzdaten im Erfolgsfall (Standard: `void`).
 */
export type ApiResponse<T = void> =
  | ApiSuccessResponse<T>
  | ApiFailResponse
  | ApiErrorResponse;