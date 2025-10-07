import * as workoutRepository from "../repositories/workout.repository";
import {
  BadRequestError,
  InternalServerError,
  UnauthorizedError
} from "../types/errors.types";
import { Workout, WorkoutExercises } from "../types/workout.types";

export async function createWorkoutPlan(
  title: string,
  userId: string,
  exercises: WorkoutExercises[]
) {
  if (!exercises || exercises.length === 0)
    throw new BadRequestError("Workout Daten fehlen");
  if (!userId) throw new UnauthorizedError("Benutzer ID fehlt");
  if (!title) throw new BadRequestError("Workout Titel fehlt");

  const databaseFormat = transformWorkoutExercisesToDatabaseFormat(
    exercises,
    userId,
    true
  );

  const newWorkout = await workoutRepository.createWorkoutPlan(
    title,
    userId,
    databaseFormat
  );
  return newWorkout;
}

export async function getAllWorkouts(userId: string) {
  const workouts = await workoutRepository.findAllWorkouts(userId);
  return workouts;
}

export async function getWorkoutById(
  workoutId: number,
  userId: string
): Promise<Workout> {
  if (!workoutId) throw new BadRequestError("Workout ID fehlt.");

  const owner = await workoutRepository.ownerCheck(workoutId, userId);

  if (!owner) throw new UnauthorizedError("Nicht berechtigt das zu tun.");

  const workoutData = await workoutRepository.findWorkoutById(workoutId);

  if (!Array.isArray(workoutData) || workoutData.length === 0) {
    throw new BadRequestError("Keine Workout-Daten gefunden.");
  }

  const { plan_title, plan_user_id } = workoutData[0];

  const newWorkout: Workout = {
    id: workoutId,
    title: plan_title,
    userId: plan_user_id,
    exercises: [],
  };

  const exerciseMap = new Map<number, WorkoutExercises>();
  workoutData.forEach((item) => {
    const exerciseId = item.exercise_id;
    let exercise = exerciseMap.get(exerciseId);

    if (!exercise) {
      exercise = {
        id: exerciseId,
        userId: item.user_Id,
        compositeKey: `${item.user_id ? "user" : "system"}-${exerciseId}`,
        title: item.title,
        displayOrder: item.display_order,
        sets: [],
      };
      exerciseMap.set(exerciseId, exercise);
    }

    exercise.sets.push({
      setNumber: item.set_number,
      repetitions: item.target_repetitions,
      weight: item.target_weight,
    });
  });

  newWorkout.exercises = Array.from(exerciseMap.values()).sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  return newWorkout;
}

// export async function getWorkoutExercises(workoutId: number) {
//   const workout = await workoutRepository.findWorkoutById(workoutId);
//   if (!workout) {
//     throw new NotFoundError("Workout nicht gefunden");
//   }
//   // let exercises: WorkoutExercises[] = [];
//   // for (const exercise of workout.exercises) {
//   //   exercises.push(exercise);
//   // }
//   return { exercises: workout.exercises, title: workout.title };
// }

export async function getCompletedWorkouts(userId: string) {
  const completedWorkouts = await workoutRepository.findCompletedWorkouts(
    userId
  );

  return completedWorkouts;
}

export async function saveCompletedWorkout(
  workoutId: number,
  userId: string,
  startTime: number,
  pauseTime: number,
  duration: number,
  exercises: WorkoutExercises[],
  title: string
) {
  const endTime = Date.now();
  const result = await workoutRepository.saveCompletedWorkout(
    userId,
    workoutId,
    title,
    startTime,
    endTime,
    duration,
    pauseTime,
    exercises
  );
  if (!result)
    throw new InternalServerError(
      "Fehler beim Speichern des abgeschlossenen Workouts"
    );
  return result;
}

export async function deleteWorkout(workoutId: number, userId: string) {
  const owner = await workoutRepository.ownerCheck(workoutId, userId);
  if (!owner)
    throw new Error(
      "Benutzer hat nicht die Rechte, dieses Workout zu bearbeiten."
    );
  // const deletedAt = Date.now();
  const result = await workoutRepository.deleteWorkout(workoutId, userId);
  if (!result)
    throw new InternalServerError("Fehler beim Löschen des Workouts");
  return result;
}

export async function updateWorkout(
  workoutId: number,
  userId: string,
  title: string,
  exercises: WorkoutExercises[]
) {
  const transformed = transformWorkoutExercisesToDatabaseFormat(
    exercises,
    userId,
    false
  );

  const result = await workoutRepository.updateWorkout(
    workoutId,
    userId,
    title,
    transformed
  );

  if (!result)
    throw new InternalServerError("Fehler beim Aktualisieren des Workouts");
  return result;
}

function transformWorkoutExercisesToDatabaseFormat(
  exercises: WorkoutExercises[],
  userId: string,
  description: boolean
): WorkoutExercises[] {
  let transformed: WorkoutExercises[] = [];

  if (description) {
    for (const ex of exercises) {
      for (const s of ex.sets) {
        transformed.push({
          id: ex.id,
          userId: userId ? userId : null,
          title: ex.title,
          description: ex.description,
          displayOrder: ex.displayOrder,
          sets: [
            {
              setNumber: s.setNumber,
              repetitions: s.repetitions,
              weight: s.weight,
            },
          ],
        });
      }
    }
  } else {
    for (const ex of exercises) {
      for (const s of ex.sets) {
        transformed.push({
          id: ex.id,
          userId: userId ? userId : null,
          title: ex.title,
          displayOrder: ex.displayOrder,
          sets: [
            {
              setNumber: s.setNumber,
              repetitions: s.repetitions,
              weight: s.weight,
            },
          ],
        });
      }
    }
  }

  return transformed;
}
