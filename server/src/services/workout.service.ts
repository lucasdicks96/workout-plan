import * as workoutRepository from "../repositories/workout.repository";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
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
    userId
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

  const workout = await workoutRepository.findWorkoutById(workoutId, userId);

  if (!workout) {
    throw new NotFoundError("Workout nicht gefunden");
  }
  return workout;
}

export async function getWorkoutExercises(workoutId: number, userId: string) {
  const workout = await workoutRepository.findWorkoutById(workoutId, userId);
  if (!workout) {
    throw new NotFoundError("Workout nicht gefunden");
  }
  // let exercises: WorkoutExercises[] = [];
  // for (const exercise of workout.exercises) {
  //   exercises.push(exercise);
  // }
  return { exercises: workout.exercises, title: workout.title };
}

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
  const workout = await workoutRepository.findWorkoutById(workoutId, userId);
  if (workout.userId !== userId)
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
  const result = await workoutRepository.updateWorkout(
    workoutId,
    userId,
    title,
    exercises
  );

  if (!result)
    throw new InternalServerError("Fehler beim Aktualisieren des Workouts");
  return result;
}

function transformWorkoutExercisesToDatabaseFormat(
  exercises: WorkoutExercises[],
  userId: string
): WorkoutExercises[] {
  let transformed: WorkoutExercises[] = [];
  let index = 0;

  for (const ex of exercises) {
    for (const s of ex.sets) {
      transformed.push({
        id: ex.id,
        userId: userId ? userId : null,
        title: ex.title,
        description: ex.description,
        displayOrder: index++,
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

  return transformed;
}
