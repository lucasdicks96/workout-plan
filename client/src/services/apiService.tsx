import axios from "axios";
import { WorkoutExercises } from "../types/workouts";

const apiClient = axios.create({
  baseURL: "http://localhost:5000", // Passe dies an deine Backend-URL an
  withCredentials: true, // Wichtig für session-basierte Authentifizierung
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor, um Fehler zentral zu behandeln
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Ein unbekannter Fehler ist aufgetreten.";
    return Promise.reject(new Error(message));
  }
);

export const apiService = {
  login: (email: string, password: string) =>
    apiClient.post("/user/login", { email, password }),
  register: (email: string, password: string) =>
    apiClient.post("/user/register", { email, password }),
  logout: () => apiClient.post("/user/logout"),
  getStatus: () => apiClient.get("/user/status"),
  // Hier weitere API-Aufrufe für Übungen, Workouts etc. hinzufügen
  createExercise: (title: string, description: string, userId: number) =>
    apiClient.post("/exercise/create-exercise", {
      title,
      description,
      userId,
    }),
  editExercise: (
    id: number,
    title: string,
    description: string,
    userId: number
  ) =>
    apiClient.put("/exercise/edit-exercise", {
      id,
      title,
      description,
      userId,
    }),
  deleteExercise: (exerciseId: number, userId: number) =>
    apiClient.delete(`/exercise/exercise/${exerciseId}/${userId}`),
  getAllExercises: (userId: number) =>
    apiClient.get(`/exercise/all-exercises/${userId}`),
  getUserExercises: (userId: number) =>
    apiClient.get(`/exercise/user-exercises/${userId}`),
  getUserId: () => apiClient.get("/user/id"),
  getAllWorkouts: () => apiClient.get("/workout/all-workouts"),
  getWorkoutExercises: (workoutId: number, userId: number) =>
    apiClient.get(`/workout/workout-exercises/${workoutId}/${userId}`),
  createWorkout: (
    title: string,
    userId: number,
    exercises: WorkoutExercises[]
  ) =>
    apiClient.post("/workout/create-workout", {
      title,
      userId,
      exercises,
    }),
  getWorkout: (workoutId: number, userId: number) =>
    apiClient.get(`/workout/workout/:${workoutId}/:${userId}`),
  updateWorkout: (
    title: string,
    userId: number,
    workoutId: number,
    exercises: WorkoutExercises[]
  ) =>
    apiClient.put("/workout/update-workout", {
      title,
      userId,
      workoutId,
      exercises,
    }),
  finishWorkout: (
    userId: number,
    workoutId: number,
    startTime: number,
    endTime: number,
    pauseTime: number,
    elapsedTime: number,
    exercises: WorkoutExercises[]
  ) =>
    apiClient.post("/workout/finish-workout", {
      userId,
      workoutId,
      startTime,
      endTime,
      pauseTime,
      elapsedTime,
      exercises,
    }),
  deleteWorkout: (userId: number, workoutId: number) =>
    apiClient.delete(`/workout/delete-workout/${userId}/${workoutId}`),
};
