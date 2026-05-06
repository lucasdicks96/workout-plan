export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Nicht gefunden") {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Ungültige Anfrage") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Nicht autorisiert") {
    super(message, 401);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = "Interner Serverfehler") {
    super(message, 500);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Konflikt") {
    super(message, 409);
  }
}
