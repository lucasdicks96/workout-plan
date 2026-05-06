export type ApiStatus = "success" | "error" | "fail";

// Für erfolgreiche Anfragen (2xx)
export interface ApiSuccessWithData<T> {
  status: "success";
  message?: string;
  data: T;
}

export interface ApiSuccessWithoutData {
  status: "success";
  message?: string;
}

// Für vorhersehbare Fehler (z.B. Validierung, 400er Fehler)
export interface ApiFailResponse {
  status: "fail";
  message: string;
  data?: any; // Z.B. Array von Validierungsfehlern
}

// Für unerwartete Serverfehler (500er Fehler)
export interface ApiErrorResponse {
  status: "error";
  message: string;
  code?: string; // Optional: Eigener Fehlercode (z.B. 'DATABASE_TIMEOUT')
}

// Wenn T als 'void' übergeben wird (oder ganz weggelassen wird),
// gilt Format 2. Sonst Format 1.
export type ApiSuccessResponse<T = void> = T extends void
  ? ApiSuccessWithoutData
  : ApiSuccessWithData<T>;

export type ApiResponse<T = void> =
  | ApiSuccessResponse<T>
  | ApiFailResponse
  | ApiErrorResponse;
