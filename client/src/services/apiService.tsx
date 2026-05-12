import axios from "axios";
import { Category, Exercise } from "../types/exercises";
import { UserWithoutPassword } from "../types/user";
import { CompletedWorkout, Workout, WorkoutExercises } from "../types/workouts";

export interface ApiResponse<T = void> {
  status: "success" | "fail";
  message?: string;
  data: T;
}

const apiClient = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add retry logic for transient errors
const RETRY_DELAY = 1000;

apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if request was not JSON or status is not retryable
    if (!originalRequest.headers || !originalRequest.headers["Content-Type"]) {
      return Promise.reject(error);
    }

    // Don't retry if already retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Retry on 408, 429, 500, 502, 503, 504
    if (
      error.response?.status &&
      [408, 429, 500, 502, 503, 504].includes(error.response.status)
    ) {
      originalRequest._retry = true;

      // Exponential backoff
      const delay = RETRY_DELAY * Math.pow(2, originalRequest._retries || 0);
      originalRequest._retries = (originalRequest._retries || 0) + 1;

      console.log(`Retry ${originalRequest._retries} after ${delay}ms`);

      await new Promise((resolve) => setTimeout(resolve, delay));

      return apiClient(originalRequest);
    }

    // Handle 401 - unauthorized
    if (error.response && error.response.status === 401) {
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
  register: (payload: { email: string; password: string }) =>
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
  }) => apiClient.put<typeof payload, ApiResponse>(`/workout/workout/${payload.workoutId}`, payload),
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
