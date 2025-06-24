import axios from "axios";

export async function fetchAllExercises() {
  try {
    const response = await axios.get(
      "http://localhost:5000/exercise/all-exercises",
      { withCredentials: true }
    );
    // console.log("Response data: ", response.data.exercises);
    return response.data.exercises;
  } catch (err) {
    console.error("Fehler beim Abrufen der Übungen:", err);
  }
}

export async function fetchExerciseById(id: number) {
  try {
    const response = await axios.get(
      `http://localhost:5000/exercise/exercise/${id}`,
      { withCredentials: true }
    );
    return response.data.exercise;
  } catch (err) {
    console.error("Fehler beim Abrufen der Übung:", err);
  }
}
