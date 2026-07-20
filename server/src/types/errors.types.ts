/**
 * Basis-Fehlerklasse für alle applikationsspezifischen Fehler.
 * Erweitert die native JavaScript-`Error`-Klasse um HTTP-Statuscodes und 
 * optionales Error-Chaining (Unterstützung für den originalen Ursprungsfehler via `cause` und Stack-Trace-Erweiterung).
 */
export class AppError extends Error {
  /**
   * Erstellt eine neue Instanz von AppError.
   * 
   * @param {string} message - Die Fehlermeldung für den Client.
   * @param {number} statusCode - Der zugehörige HTTP-Statuscode (z. B. 400, 500).
   * @param {unknown} [originalError] - Der originale Ursprungsfehler (z. B. ein Datenbank- oder Bibliotheksfehler).
   */
  constructor(
    public message: string,
    public statusCode: number,
    public originalError?: unknown,
  ) {
    // Gibt den originalen Fehler nativ als 'cause' an Node.js weiter
    super(message, { cause: originalError });

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    // Fügt den echten (z. B. Datenbank-) Stack-Trace hinzu, falls vorhanden
    if (originalError instanceof Error && originalError.stack) {
      this.stack = `${this.stack}\n\n--- URSACHE (ORIGINAL ERROR) ---\n${originalError.stack}`;
    }
  }
}

/**
 * Repräsentiert einen HTTP 404 (Not Found) Fehler, wenn eine angeforderte Ressource nicht existiert.
 */
export class NotFoundError extends AppError {
  /**
   * Erstellt eine neue Instanz von NotFoundError.
   * 
   * @param {string} [message="Nicht gefunden"] - Die Fehlermeldung.
   * @param {unknown} [originalError] - Der optionale Originalfehler.
   */
  constructor(message: string = "Nicht gefunden", originalError?: unknown) {
    super(message, 404, originalError);
  }
}

/**
 * Repräsentiert einen HTTP 400 (Bad Request) Fehler bei ungültigen Client-Anfragen oder Validierungsfehlern.
 */
export class BadRequestError extends AppError {
  /**
   * Erstellt eine neue Instanz von BadRequestError.
   * 
   * @param {string} [message="Ungültige Anfrage"] - Die Fehlermeldung.
   * @param {unknown} [originalError] - Der optionale Originalfehler.
   */
  constructor(message: string = "Ungültige Anfrage", originalError?: unknown) {
    super(message, 400, originalError);
  }
}

/**
 * Repräsentiert einen HTTP 401 (Unauthorized) Fehler, wenn keine oder eine ungültige Authentifizierung vorliegt.
 */
export class UnauthorizedError extends AppError {
  /**
   * Erstellt eine neue Instanz von UnauthorizedError.
   * 
   * @param {string} [message="Nicht autorisiert"] - Die Fehlermeldung.
   * @param {unknown} [originalError] - Der optionale Originalfehler.
   */
  constructor(message: string = "Nicht autorisiert", originalError?: unknown) {
    super(message, 401, originalError);
  }
}

/**
 * Repräsentiert einen HTTP 403 (Forbidden) Fehler, wenn der Benutzer zwar authentifiziert ist, 
 * aber keine Berechtigung für die angeforderte Aktion besitzt.
 */
export class ForbiddenError extends AppError {
  /**
   * Erstellt eine neue Instanz von ForbiddenError.
   * 
   * @param {string} [message="Nicht autorisiert"] - Die Fehlermeldung.
   * @param {unknown} [originalError] - Der optionale Originalfehler.
   */
  constructor(message: string = "Nicht autorisiert", originalError?: unknown) {
    super(message, 403, originalError);
  }
}

/**
 * Repräsentiert einen HTTP 500 (Internal Server Error) Fehler bei unerwarteten Server- oder Systemfehlern.
 */
export class InternalServerError extends AppError {
  /**
   * Erstellt eine neue Instanz von InternalServerError.
   * 
   * @param {string} [message="Interner Serverfehler"] - Die Fehlermeldung.
   * @param {unknown} [originalError] - Der optionale Originalfehler.
   */
  constructor(
    message: string = "Interner Serverfehler",
    originalError?: unknown,
  ) {
    super(message, 500, originalError);
  }
}

/**
 * Repräsentiert einen HTTP 409 (Conflict) Fehler, z. B. bei Duplikaten (Unique-Constraint-Verletzungen).
 */
export class ConflictError extends AppError {
  /**
   * Erstellt eine neue Instanz von ConflictError.
   * 
   * @param {string} [message="Konflikt"] - Die Fehlermeldung.
   * @param {unknown} [originalError] - Der optionale Originalfehler.
   */
  constructor(message: string = "Konflikt", originalError?: unknown) {
    super(message, 409, originalError);
  }
}