import axios, { InternalAxiosRequestConfig } from "axios";
import {
  CategorySchema,
  ExerciseSchema,
  ExercisePerformanceSchema,
} from "../schemas/exercise.schema";
import { UserWithoutPasswordSchema } from "../schemas/user.schema";
import {
  CompletedWorkoutSchema,
  WorkoutSchema,
  WorkoutExercises,
  CompletedWorkout,
} from "../schemas/workout.schema";
import { z } from "zod";

/**
 * Standardisierte Struktur einer API-Antwort des Backends.
 *
 * @template T - Der Datentyp der Nutzdaten (`data`). Standard ist `void`.
 * @property {"success" | "fail"} status - Der Erfolgsstatus der HTTP-Anfrage.
 * @property {string} [message] - Optionale Servernachricht (z. B. bei Fehlern oder Erfolgsbestätigungen).
 * @property {T} data - Die eigentlichen Nutzdaten der Antwort.
 */
export interface ApiResponse<T = void> {
  status: "success" | "fail";
  message?: string;
  data: T;
}

/**
 * In-Memory-Speicher für den CSRF-Token.
 * Wird bewusst im Arbeitsspeicher gehalten (statt im localStorage), um XSS-Angriffen
 * keine Angriffsfläche zum Auslesen des Tokens zu bieten.
 */
let csrfToken: string | null = null;

/**
 * Konfigurierte Axios-Grundinstanz für die gesamte App-Kommunikation.
 * Steuert automatisch die Base-URL (Dev vs. Prod) und aktiviert `withCredentials: true`,
 * damit Session-Cookies (z. B. HttpOnly Auth-Cookies) bei jedem Request mitgesendet werden.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:5000/"
    : import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Ruft einen frischen CSRF-Token vom Backend ab und speichert ihn in der globalen Variable `csrfToken`.
 *
 * @async
 * @returns {Promise<string>} Der neu abgerufene CSRF-Token.
 * @throws {Error} Wenn der Abruf fehlschlägt (z. B. wegen Netzwerkproblemen).
 */
const fetchCsrfToken = async (): Promise<string> => {
  try {
    const baseURL = import.meta.env.DEV
      ? "http://localhost:5000"
      : import.meta.env.VITE_API_URL || "";

    const response = await axios.get(`${baseURL}/csrf-token`, {
      withCredentials: true,
    });
    csrfToken = response.data.csrfToken;
    return csrfToken as string;
  } catch (error) {
    console.error("Fehler beim Abrufen des CSRF-Tokens:", error);
    throw error;
  }
};

/**
 * REQUEST INTERCEPTOR:
 * Fängt jede ausgehende HTTP-Anfrage ab. Wenn es sich um eine schreibende Methode
 * (`POST`, `PUT`, `DELETE`, `PATCH`) handelt, wird automatisch der aktuelle CSRF-Token
 * in den Header `x-csrf-token` injiziert. Fehlt der Token im Speicher, wird vorab ein neuer abgerufen.
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const unsafeMethods = ["post", "put", "delete", "patch"];

    if (config.method && unsafeMethods.includes(config.method.toLowerCase())) {
      // Wenn noch kein Token da ist, erst einen holen
      if (!csrfToken) {
        await fetchCsrfToken();
      }
      // Token in den Header setzen (Name muss exakt zur Backend-Config passen!)
      if (csrfToken && config.headers) {
        config.headers["x-csrf-token"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/** Basis-Wartezeit (in Millisekunden) für den exponentiellen Backoff bei Serverfehlern. */
const RETRY_DELAY = 1000;

/**
 * RESPONSE INTERCEPTOR:
 * Transformiert erfolgreiche Antworten und steuert eine mehrstufige Fehler- und Retry-Logik:
 * 1. Data-Unwrapping: Gibt direkt `response.data` zurück, um redundantes `.data`-Zugreifen im Code zu sparen.
 * 2. CSRF-Recovery (403): Lehnt das Backend einen Token ab, wird genau einmal ein neuer Token geholt und der Request wiederholt.
 * 3. Exponential Backoff (408, 500-504): Bei temporären Serverausfällen wird die Anfrage mit exponentiell steigender Wartezeit (1s, 2s, 4s...) wiederholt.
 * 4. Auth-Guard (401): Bei fehlender Authentifizierung wird der In-Memory CSRF-Token gelöscht und der Nutzer auf die Login-Seite umgeleitet (außer bei Public-Routes).
 */
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Kein Retry, wenn es kein JSON-Request war
    if (!originalRequest.headers || !originalRequest.headers["Content-Type"]) {
      return Promise.reject(error);
    }

    // Kein Retry, wenn wir es schon versucht haben
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Wenn das Backend den Token ablehnt, holen wir einen neuen und versuchen den Request einmal erneut
    if (error.response?.status === 403 && !originalRequest._csrfRetry) {
      originalRequest._csrfRetry = true;
      try {
        console.warn("CSRF-Token ungültig/abgelaufen. Hole neuen Token...");
        const newToken = await fetchCsrfToken();
        originalRequest.headers["x-csrf-token"] = newToken;
        return apiClient(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    // Automatisches Retry bei temporären Server- / Timeout-Fehlern
    if (
      error.response?.status &&
      [408, 500, 502, 503, 504].includes(error.response.status)
    ) {
      originalRequest._retry = true;

      // Exponentieller Backoff: 1000ms * 2^retries (z. B. 1000ms, 2000ms, 4000ms)
      const delay = RETRY_DELAY * Math.pow(2, originalRequest._retries || 0);
      originalRequest._retries = (originalRequest._retries || 0) + 1;

      console.log(`Retry ${originalRequest._retries} nach ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      return apiClient(originalRequest);
    }

    // 401 - Unauthorized Handling
    if (error.response && error.response.status === 401) {
      // Wenn wir ein 401 bekommen, verwerfen wir auch den alten CSRF-Token
      csrfToken = null;

      const originalRequestUrl = error.config?.url;
      const publicUrls = ["/user/login", "/user/register", "/user/status"];

      if (!publicUrls.includes(originalRequestUrl || "")) {
        console.warn("Unauthorized access attempt, redirecting to login");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Hilfsfunktion: Hüllt ein Zod-Datenschema in ein äußeres Objekt mit einer `data`-Eigenschaft ein.
 * Da der Axios Response-Interceptor `response.data` zurückgibt, haben unsere API-Antworten
 * zur Laufzeit die Form `{ status: "success", data: ... }`. Diese Funktion validiert diesen Wrapper.
 *
 * @template T - Ein gültiger Zod-Schema-Typ.
 * @param {T} dataSchema - Das Zod-Schema für die eigentlichen Nutzdaten.
 * @returns Ein Zod-Objektschema, das ein `data`-Feld mit dem übergebenen Schema erzwingt.
 */
function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.looseObject({
    data: dataSchema,
  });
}

/**
 * Zentraler API-Service der Anwendung.
 *
 * Bündelt alle Backend-Aufrufe in einer einheitlichen Schnittstelle.
 * Methoden, die Daten abfragen (GET) oder sensible Mutationen durchführen (Login/Register),
 * nutzen zur Laufzeit `.parse(res)`, um über Zod eine strikte Typ- und Struktursicherheit zu erzwingen.
 * Sollte das Backend vom Schema abweichen, wirft Zod einen Laufzeitfehler, bevor fehlerhafte Daten in die UI gelangen.
 */
export const apiService = {
  // ============================================================================
  // USER / AUTHENTIFIZIERUNG
  // ============================================================================

  /**
   * Meldet einen Benutzer an und validiert die Rückgabedaten gegen das Zod-User-Schema (ohne Passwort).
   */
  login: async (payload: { email: string; password: string }) => {
    const res = await apiClient.post("/user/login", payload);
    return createApiResponseSchema(UserWithoutPasswordSchema).parse(res);
  },

  /**
   * Registriert einen neuen Benutzer inklusive Cloudflare Turnstile-Bot-Schutz.
   */
  register: async (payload: {
    email: string;
    password: string;
    turnstileToken: string;
  }) => {
    const res = await apiClient.post("/user/register", payload);
    return createApiResponseSchema(UserWithoutPasswordSchema).parse(res);
  },

  /**
   * Meldet den aktuellen Benutzer ab und zerstört die Session auf dem Server.
   */
  logout: () => apiClient.post<unknown, ApiResponse>("/user/logout"),

  /**
   * Prüft den aktuellen Login-Status und lädt die Benutzerdaten der aktiven Session.
   */
  getStatus: async () => {
    const res = await apiClient.get("/user/status");
    return createApiResponseSchema(UserWithoutPasswordSchema).parse(res);
  },

  /**
   * Ruft die eindeutige ID des aktuellen Benutzers ab.
   */
  getUserId: async () => {
    const res = await apiClient.get("/user/id");
    return createApiResponseSchema(z.string()).parse(res);
  },

  // ============================================================================
  // ÜBUNGEN (EXERCISES) & KATEGORIEN
  // ============================================================================

  /**
   * Erstellt eine neue Übung und validiert das vom Server zurückgegebene Übungsobjekt.
   */
  postExercise: async (payload: {
    title: string;
    description: string;
    categories: number[];
  }) => {
    apiClient.post<typeof payload, ApiResponse>("/exercise/exercise", payload);
  },

  /**
   * Aktualisiert eine bestehende Übung.
   */
  putExercise: (payload: {
    id: number;
    title: string;
    description: string;
    categories: number[];
  }) =>
    apiClient.put<typeof payload, ApiResponse>("/exercise/exercise", payload),

  /**
   * Löscht eine Übung unwiderruflich anhand ihrer ID.
   */
  deleteExercise: (id: number) =>
    apiClient.delete<never, ApiResponse>(`/exercise/exercise/${id}`),

  /**
   * Lädt den globalen, allgemeinen Übungskatalog.
   */
  getExercises: async () => {
    const res = await apiClient.get(`/exercise/exercises`);
    return createApiResponseSchema(z.array(ExerciseSchema)).parse(res);
  },

  /**
   * Lädt die letzten absolvierten Sätze (Gewichte/Wiederholungen) für eine spezifische Übung.
   *
   * @param {number} exerciseId - Die ID der Übung.
   */
  getLastPerformance: async (exerciseId: number) => {
    const res = await apiClient.get(`/exercise/${exerciseId}/last-performance`);
    return createApiResponseSchema(z.array(ExercisePerformanceSchema)).parse(
      res,
    );
  },

  /**
   * Lädt alle benutzerspezifisch erstellten Übungen.
   */
  getUserExercises: async () => {
    const res = await apiClient.get(`/exercise/user-exercises`);
    return createApiResponseSchema(z.array(ExerciseSchema)).parse(res);
  },

  /**
   * Lädt den kompletten hierarchischen Kategoriebaum.
   */
  getCategoryTree: async () => {
    const res = await apiClient.get("/exercise/category-tree");
    return createApiResponseSchema(z.array(CategorySchema)).parse(res);
  },

  // ============================================================================
  // TRAININGSPLÄNE (WORKOUTS)
  // ============================================================================

  /**
   * Lädt alle verfügbaren Trainingspläne des Benutzers.
   */
  getWorkouts: async () => {
    const res = await apiClient.get(`/workout/workouts`);
    return createApiResponseSchema(z.array(WorkoutSchema)).parse(res);
  },

  /**
   * Lädt einen spezifischen Trainingsplan anhand seiner ID.
   */
  getWorkout: async (workoutId: number) => {
    const res = await apiClient.get(`/workout/workout/${workoutId}`);
    return createApiResponseSchema(WorkoutSchema).parse(res);
  },

  /**
   * Lädt die Daten des letzten absolvierten Trainings dieses Plans (z. B. zur Vorbefüllung von Gewichten).
   */
  getLastWorkout: async (workoutId: number) => {
    const res = await apiClient.get(`/workout/last-workout/${workoutId}`);
    return createApiResponseSchema(WorkoutSchema).parse(res);
  },

  /**
   * Erstellt einen neuen Trainingsplan mit den ausgewählten Übungen.
   */
  postWorkout: (payload: { title: string; exercises: WorkoutExercises[] }) =>
    apiClient.post<typeof payload, ApiResponse>("/workout/workout", payload),

  /**
   * Aktualisiert Titel und Übungsstruktur eines bestehenden Trainingsplans.
   */
  putWorkout: (payload: {
    title: string;
    workoutId: number;
    exercises: WorkoutExercises[];
  }) =>
    apiClient.put<typeof payload, ApiResponse>(
      `/workout/workout/${payload.workoutId}`,
      payload,
    ),

  /**
   * Löscht einen Trainingsplan anhand seiner ID.
   */
  deleteWorkout: (workoutId: number) =>
    apiClient.delete<never, ApiResponse>(`/workout/workout/${workoutId}`),

  // ============================================================================
  // ABGESCHLOSSENE WORKOUTS (HISTORIE / STATISTIKEN)
  // ============================================================================

  /**
   * Speichert eine erfolgreich absolvierte Trainingssession (inkl. Zeiten, Sätzen und Pausendauer).
   */
  postCompletedWorkout: (payload: {
    workoutId: number;
    startTime: number;
    endTime: number;
    pauseTime: number;
    duration: number;
    exercises: WorkoutExercises[];
    title: string;
  }) =>
    apiClient.post<typeof payload, ApiResponse>(
      "/workout/completed-workout",
      payload,
    ),

  /**
   * Lädt die Historie aller abgeschlossenen Trainingssessions (z. B. für die Analyse-Seite).
   */
  getCompletedWorkouts: async () => {
    const res = await apiClient.get(`/workout/completed-workouts`);
    return createApiResponseSchema(z.array(CompletedWorkoutSchema)).parse(res);
  },

  /**
   * Lädt die detaillierten Daten einer einzelnen abgeschlossenen Trainingssession anhand der UUID/String-ID.
   */
  getCompletedWorkout: async (workoutId: string) => {
    const res = await apiClient.get(`/workout/completed-workout/${workoutId}`);
    return createApiResponseSchema(CompletedWorkoutSchema).parse(res);
  },

  /**
   * Aktualisiert eine bereits gespeicherte Trainingssession nachträglich.
   */
  putCompletedWorkout: (payload: CompletedWorkout) =>
    apiClient.put<typeof payload, ApiResponse>(
      `/workout/completed-workout`,
      payload,
    ),
};
