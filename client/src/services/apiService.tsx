import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5000", // Passe dies an deine Backend-URL an
  withCredentials: true, // Wichtig für session-basierte Authentifizierung
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor, um Fehler zentral zu behandeln
apiClient.interceptors.response.use(
  (response) => response,
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
      userId: userId,
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
  deleteExercise: (id: number, userId: number) =>
    apiClient.delete(`/exercise/delete-exercise/${id}/${userId}`),
  getAllExercises: (userId: number) =>
    apiClient.get(`/exercise/all-exercises/${userId}`),
  getUserExercises: (userId: number) =>
    apiClient.get(`/exercise/user-exercises/${userId}`),
  getUserId: () => apiClient.get("/user/id"),
};
