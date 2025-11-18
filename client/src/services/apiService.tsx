import axios from "axios";
import { WorkoutExercises } from "../types/workouts";

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
  }
);

export const apiService = {
  login: (email: string, password: string) =>
    apiClient.post("/user/login", { email, password }),
  register: (email: string, password: string) =>
    apiClient.post("/user/register", { email, password }),
  logout: () => apiClient.post("/user/logout"),
  getStatus: () => apiClient.get("/user/status"),
  createExercise: (title: string, description: string, categories: number[]) =>
    apiClient.post("/exercise/create-exercise", {
      title,
      description,
      categories,
    }),
  editExercise: (
    id: number,
    title: string,
    description: string,
    categories: number[]
  ) =>
    apiClient.put("/exercise/edit-exercise", {
      id,
      title,
      description,
      categories,
    }),
  deleteExercise: (id: number) =>
    apiClient.delete(`/exercise/delete-exercise/${id}`),
  // getAllExercises: (userId: string) =>
  //   apiClient.get(`/exercise/all-exercises/${userId}`),
  getAllExercises: () => apiClient.get(`/exercise/all-exercises`),
  getUserExercises: () => apiClient.get(`/exercise/user-exercises`),
  getCategoryTree: () => apiClient.get("/exercise/category-tree"),
  getUserId: () => apiClient.get("/user/id"),
  // getAllWorkouts: (userId: string) =>
  //   apiClient.get(`/workout/all-workouts/${userId}`),
  getAllWorkouts: () => apiClient.get(`/workout/all-workouts`),
  getWorkoutExercises: (workoutId: number) =>
    apiClient.get(`/workout/workout-exercises/${workoutId}`),
  getLastWorkout: (workoutId: number) =>
    apiClient.get(`/workout/last-workout/${workoutId}`),
  createWorkout: (title: string, exercises: WorkoutExercises[]) =>
    apiClient.post("/workout/create-workout", {
      title,
      exercises,
    }),
  getWorkout: (workoutId: number) =>
    apiClient.get(`/workout/workout/${workoutId}`),
  updateWorkout: (
    title: string,
    workoutId: number,
    exercises: WorkoutExercises[]
  ) =>
    apiClient.put("/workout/update-workout", {
      title,
      workoutId,
      exercises,
    }),
  saveCompletedWorkout: (
    workoutId: number,
    startTime: number,
    endTime: number,
    pauseTime: number,
    duration: number,
    exercises: WorkoutExercises[],
    title: string
  ) =>
    apiClient.post("/workout/save-completed-workout", {
      workoutId,
      startTime,
      endTime,
      pauseTime,
      duration,
      exercises,
      title,
    }),
  getCompletedWorkouts: () => apiClient.get(`/workout/completed-workouts`),
  deleteWorkout: (workoutId: number) =>
    apiClient.delete(`/workout/delete-workout/${workoutId}`),
};
