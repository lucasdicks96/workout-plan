import axios from "axios";
import { CompletedWorkout, WorkoutExercises } from "../types/workouts";

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
    return response;
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
    if (error.response?.status && [408, 429, 500, 502, 503, 504].includes(error.response.status)) {
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
  login: (email: string, password: string) =>
    apiClient.post("/user/login", { email, password }).then((res) => res.data),
  register: (email: string, password: string) =>
    apiClient.post("/user/register", { email, password }).then((res) => res.data),
  logout: () => apiClient.post("/user/logout").then((res) => res.data),
  getStatus: () => apiClient.get("/user/status").then((res) => res.data),
  postExercise: (title: string, description: string, categories: number[]) =>
    apiClient.post("/exercise/exercise", {
      title,
      description,
      categories,
    }),
  putExercise: (
    id: number,
    title: string,
    description: string,
    categories: number[],
  ) =>
    apiClient.put("/exercise/exercise", {
      id,
      title,
      description,
      categories,
    }),
  deleteExercise: (id: number) => apiClient.delete(`/exercise/exercise/${id}`),
  // getAllExercises: (userId: string) =>
  //   apiClient.get(`/exercise/all-exercises/${userId}`),
  getExercises: () => apiClient.get(`/exercise/exercises`),
  getUserExercises: () => apiClient.get(`/exercise/user-exercises`),
  getCategoryTree: () => apiClient.get("/exercise/category-tree"),
  getUserId: () => apiClient.get("/user/id"),
  // getAllWorkouts: (userId: string) =>
  //   apiClient.get(`/workout/all-workouts/${userId}`),
  getWorkouts: () => apiClient.get(`/workout/workouts`),
  getWorkout: (workoutId: number) =>
    apiClient.get(`/workout/workout/${workoutId}`),
  getLastWorkout: (workoutId: number) =>
    apiClient.get(`/workout/last-workout/${workoutId}`),
  postWorkout: (title: string, exercises: WorkoutExercises[]) =>
    apiClient.post("/workout/workout", {
      title,
      exercises,
    }),
  putWorkout: (
    title: string,
    workoutId: number,
    exercises: WorkoutExercises[],
  ) =>
    apiClient.put("/workout/workout", {
      title,
      workoutId,
      exercises,
    }),
  postCompletedWorkout: (
    workoutId: number,
    startTime: number,
    endTime: number,
    pauseTime: number,
    duration: number,
    exercises: WorkoutExercises[],
    title: string,
  ) =>
    apiClient.post("/workout/completed-workout", {
      workoutId,
      startTime,
      endTime,
      pauseTime,
      duration,
      exercises,
      title,
    }),
  getCompletedWorkouts: () => apiClient.get(`/workout/completed-workouts`),
  getCompletedWorkout: (workoutId: string) =>
    apiClient.get(`/workout/completed-workouts/${workoutId}`),
  putCompletedWorkout: (workoutId: string, workout: CompletedWorkout) =>
    apiClient.put(`/workout/completed-workout`, { workoutId, workout }),
  deleteWorkout: (workoutId: number) =>
    apiClient.delete(`/workout/workout/${workoutId}`),
};
