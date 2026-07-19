import axios, { InternalAxiosRequestConfig } from "axios";
import { Category, Exercise } from "../types/exercises";
import { UserWithoutPassword } from "../types/user";
import { CompletedWorkout, Workout, WorkoutExercises } from "../types/workouts";

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

    const response = await axios.get(
      `${baseURL}/csrf-token`,
      {
        withCredentials: true,
      },
    );
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

export const apiService = {
  login: (payload: { email: string; password: string }) =>
    apiClient.post<typeof payload, ApiResponse<UserWithoutPassword>>(
      "/user/login",
      payload,
    ),
  register: (payload: {
    email: string;
    password: string;
    turnstileToken: string;
  }) =>
    apiClient.post<typeof payload, ApiResponse<UserWithoutPassword>>(
      "/user/register",
      payload,
    ),
  logout: () => apiClient.post<unknown, ApiResponse>("/user/logout"),
  getStatus: () =>
    apiClient.get<never, ApiResponse<UserWithoutPassword>>("/user/status"),
  postExercise: (payload: {
    title: string;
    description: string;
    categories: number[];
  }) =>
    apiClient.post<typeof payload, ApiResponse<Exercise>>(
      "/exercise/exercise",
      payload,
    ),
  putExercise: (payload: {
    id: number;
    title: string;
    description: string;
    categories: number[];
  }) =>
    apiClient.put<typeof payload, ApiResponse>("/exercise/exercise", payload),

  deleteExercise: (id: number) =>
    apiClient.delete<never, ApiResponse>(`/exercise/exercise/${id}`),

  getExercises: () =>
    apiClient.get<never, ApiResponse<Exercise[]>>(`/exercise/exercises`),
  getUserExercises: () =>
    apiClient.get<never, ApiResponse<Exercise[]>>(`/exercise/user-exercises`),
  getCategoryTree: () =>
    apiClient.get<never, ApiResponse<Category[]>>("/exercise/category-tree"),
  getUserId: () => apiClient.get<never, ApiResponse<string>>("/user/id"),
  // getAllWorkouts: (userId: string) =>
  //   apiClient.get(`/workout/all-workouts/${userId}`),
  getWorkouts: () =>
    apiClient.get<never, ApiResponse<Workout[]>>(`/workout/workouts`),
  getWorkout: (workoutId: number) =>
    apiClient.get<never, ApiResponse<Workout>>(`/workout/workout/${workoutId}`),
  getLastWorkout: (workoutId: number) =>
    apiClient.get<never, ApiResponse<Workout>>(
      `/workout/last-workout/${workoutId}`,
    ),
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
  getCompletedWorkouts: () =>
    apiClient.get<never, ApiResponse<CompletedWorkout[]>>(
      `/workout/completed-workouts`,
    ),
  getCompletedWorkout: (workoutId: string) =>
    apiClient.get<never, ApiResponse<CompletedWorkout>>(
      `/workout/completed-workout/${workoutId}`,
    ),
  putCompletedWorkout: (payload: CompletedWorkout) =>
    apiClient.put<typeof payload, ApiResponse>(
      `/workout/completed-workout`,
      payload,
    ),
  deleteWorkout: (workoutId: number) =>
    apiClient.delete<never, ApiResponse>(`/workout/workout/${workoutId}`),
};
