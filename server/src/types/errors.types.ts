export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public originalError?: unknown, // Neu: Der "Blinde Passagier"
  ) {
    // Gibt den originalen Fehler nativ als 'cause' an Node.js weiter
    super(message, { cause: originalError });

    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    // Fügt den echten (z.B. Datenbank-) Stack-Trace hinzu, falls vorhanden
    if (originalError instanceof Error && originalError.stack) {
      this.stack = `${this.stack}\n\n--- URSACHE (ORIGINAL ERROR) ---\n${originalError.stack}`;
    }
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Nicht gefunden", originalError?: unknown) {
    super(message, 404, originalError);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Ungültige Anfrage", originalError?: unknown) {
    super(message, 400, originalError);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Nicht autorisiert", originalError?: unknown) {
    super(message, 401, originalError);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Nicht autorisiert", originalError?: unknown) {
    super(message, 403, originalError);
  }
}

export class InternalServerError extends AppError {
  constructor(
    message: string = "Interner Serverfehler",
    originalError?: unknown,
  ) {
    super(message, 500, originalError);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Konflikt", originalError?: unknown) {
    super(message, 409, originalError);
  }
}
