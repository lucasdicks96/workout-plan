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
  createExercise: (title: string, description: string, userId: string) =>
    apiClient.post("/exercise/create-exercise", {
      title,
      description,
      userId,
    }),
  editExercise: (
    id: number,
    title: string,
    description: string,
    userId: string
  ) =>
    apiClient.put("/exercise/edit-exercise", {
      id,
      title,
      description,
      userId,
    }),
  deleteExercise: (exerciseId: number, userId: string) =>
    apiClient.delete(`/exercise/exercise/${exerciseId}/${userId}`),
  getAllExercises: (userId: string) =>
    apiClient.get(`/exercise/all-exercises/${userId}`),
  getUserExercises: (userId: string) =>
    apiClient.get(`/exercise/user-exercises/${userId}`),
  getUserId: () => apiClient.get("/user/id"),
  getAllWorkouts: (userId: string) =>
    apiClient.get(`/workout/all-workouts/${userId}`),
  getWorkoutExercises: (workoutId: number, userId: string) =>
    apiClient.get(`/workout/workout-exercises/${workoutId}/${userId}`),
  createWorkout: (
    title: string,
    userId: string,
    exercises: WorkoutExercises[]
  ) =>
    apiClient.post("/workout/create-workout", {
      title,
      userId,
      exercises,
    }),
  getWorkout: (workoutId: number, userId: string) =>
    apiClient.get(`/workout/workout/${workoutId}/${userId}`),
  updateWorkout: (
    title: string,
    userId: string,
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
    userId: string,
    workoutId: number,
    startTime: number,
    endTime: number,
    pauseTime: number,
    elapsedTime: number,
    exercises: WorkoutExercises[],
    title: string,
    date: string
  ) =>
    apiClient.post("/workout/finish-workout", {
      userId,
      workoutId,
      startTime,
      endTime,
      pauseTime,
      elapsedTime,
      exercises,
      title,
      date,
    }),
  getCompletedWorkouts: (userId: string) =>
    apiClient.get(`/workout/completed-workouts/${userId}`),
  deleteWorkout: (userId: string, workoutId: number) =>
    apiClient.delete(`/workout/delete-workout/${userId}/${workoutId}`),
};
