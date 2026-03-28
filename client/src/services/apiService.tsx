import axios from "axios";
import { CompletedWorkout, WorkoutExercises } from "../types/workouts";

const apiClient = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const originalRequestUrl = error.config.url;
      const publicUrls = ["/user/login", "/user/register", "/user/status"];

      if (!publicUrls.includes(originalRequestUrl)) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export const apiService = {
  login: (email: string, password: string) =>
    apiClient.post("/user/login", { email, password }),
  register: (email: string, password: string) =>
    apiClient.post("/user/register", { email, password }),
  logout: () => apiClient.post("/user/logout"),
  getStatus: () => apiClient.get("/user/status"),
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
