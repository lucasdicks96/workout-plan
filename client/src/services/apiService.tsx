import axios, { InternalAxiosRequestConfig } from "axios";
import { CategorySchema, ExerciseSchema } from "../schemas/exercise.schema";
import { UserWithoutPasswordSchema } from "../schemas/user.schema";
import {
  CompletedWorkoutSchema,
  WorkoutSchema,
  WorkoutExercises,
  CompletedWorkout,
} from "../schemas/workout.schema";
import { z } from "zod";

export interface ApiResponse<T = void> {
  status: "success" | "fail";
  message?: string;
  data: T;
}

// 1. CSRF Token im Arbeitsspeicher speichern (sicher gegen XSS)
let csrfToken: string | null = null;

const apiClient = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://localhost:5000/"
    : import.meta.env.VITE_API_URL || "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Hilfsfunktion zum Abholen des CSRF-Tokens vom Backend
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

// 2. REQUEST INTERCEPTOR: Hängt den CSRF-Token an alle schreibenden Requests an
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

const RETRY_DELAY = 1000;

// 3. RESPONSE INTERCEPTOR: Fehlerbehandlung und Retries
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

    if (
      error.response?.status &&
      [408, 500, 502, 503, 504].includes(error.response.status)
    ) {
      originalRequest._retry = true;

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

function createApiResponseSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.looseObject({
    data: dataSchema,
  });
}

export const apiService = {
  login: async (payload: { email: string; password: string }) => {
    const res = await apiClient.post("/user/login", payload);
    // Hier schlägt Zod zur Laufzeit zu und erzwingt das UserWithoutPasswordSchema!
    return createApiResponseSchema(UserWithoutPasswordSchema).parse(res);
  },

  register: async (payload: {
    email: string;
    password: string;
    turnstileToken: string;
  }) => {
    const res = await apiClient.post("/user/register", payload);
    return createApiResponseSchema(UserWithoutPasswordSchema).parse(res);
  },

  logout: () => apiClient.post<unknown, ApiResponse>("/user/logout"),

  getStatus: async () => {
    const res = await apiClient.get("/user/status");
    return createApiResponseSchema(UserWithoutPasswordSchema).parse(res);
  },

  postExercise: async (payload: {
    title: string;
    description: string;
    categories: number[];
  }) => {
    const res = await apiClient.post("/exercise/exercise", payload);
    return createApiResponseSchema(ExerciseSchema).parse(res);
  },

  putExercise: (payload: {
    id: number;
    title: string;
    description: string;
    categories: number[];
  }) =>
    apiClient.put<typeof payload, ApiResponse>("/exercise/exercise", payload),

  deleteExercise: (id: number) =>
    apiClient.delete<never, ApiResponse>(`/exercise/exercise/${id}`),

  // --- HIER WIRD DER STRING-VS-NUMBER BUG BEI ÜBUNGEN GEFIXT: ---
  getExercises: async () => {
    const res = await apiClient.get(`/exercise/exercises`);
    // z.array() sagt Zod, dass ein Array von Übungen in "data" liegt.
    // Alle IDs, die hier als "42" (String) ankommen, verlassen diese Zeile als 42 (Number)!
    return createApiResponseSchema(z.array(ExerciseSchema)).parse(res);
  },

  getUserExercises: async () => {
    const res = await apiClient.get(`/exercise/user-exercises`);
    return createApiResponseSchema(z.array(ExerciseSchema)).parse(res);
  },

  getCategoryTree: async () => {
    const res = await apiClient.get("/exercise/category-tree");
    return createApiResponseSchema(z.array(CategorySchema)).parse(res);
  },

  getUserId: async () => {
    const res = await apiClient.get("/user/id");
    return createApiResponseSchema(z.string()).parse(res);
  },

  getWorkouts: async () => {
    const res = await apiClient.get(`/workout/workouts`);
    return createApiResponseSchema(z.array(WorkoutSchema)).parse(res);
  },

  getWorkout: async (workoutId: number) => {
    const res = await apiClient.get(`/workout/workout/${workoutId}`);
    return createApiResponseSchema(WorkoutSchema).parse(res);
  },

  getLastWorkout: async (workoutId: number) => {
    const res = await apiClient.get(`/workout/last-workout/${workoutId}`);
    return createApiResponseSchema(WorkoutSchema).parse(res);
  },

  postWorkout: (payload: { title: string; exercises: WorkoutExercises[] }) =>
    apiClient.post<typeof payload, ApiResponse>("/workout/workout", payload),

  putWorkout: (payload: {
    title: string;
    workoutId: number;
    exercises: WorkoutExercises[];
  }) =>
    apiClient.put<typeof payload, ApiResponse>(
      `/workout/workout/${payload.workoutId}`,
      payload,
    ),

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

  getCompletedWorkouts: async () => {
    const res = await apiClient.get(`/workout/completed-workouts`);
    return createApiResponseSchema(z.array(CompletedWorkoutSchema)).parse(res);
  },

  getCompletedWorkout: async (workoutId: string) => {
    const res = await apiClient.get(`/workout/completed-workout/${workoutId}`);
    return createApiResponseSchema(CompletedWorkoutSchema).parse(res);
  },

  putCompletedWorkout: (payload: CompletedWorkout) =>
    apiClient.put<typeof payload, ApiResponse>(
      `/workout/completed-workout`,
      payload,
    ),

  deleteWorkout: (workoutId: number) =>
    apiClient.delete<never, ApiResponse>(`/workout/workout/${workoutId}`),
};
