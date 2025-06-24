import axios from "axios";

export async function fetchAllWorkouts() {
  try {
    const response = await axios.get(
      "http://localhost:5000/workout/all-workouts",
      { withCredentials: true }
    );
    return response.data.workouts;
  } catch (error) {
    console.error("Error fetching workouts:", error);
  }
}
export async function fetchWorkoutById(id: number) {
  try {
    const response = await axios.get(
      `http://localhost:5000/workout/workout/${id}`,
      { withCredentials: true }
    );
    return response.data.workout;
  } catch (error) {
    console.error("Error fetching workout by ID:", error);
  }
}
// export async function createWorkout(workoutData: any) {
//   try {
//     const response = await axios.post(
//       "http://localhost:5000/workout/create-workout",
//       workoutData,
//       { withCredentials: true }
//     );
//     return response.data;
//   } catch (error) {
//     console.error("Error creating workout:", error);
//   }
// }
