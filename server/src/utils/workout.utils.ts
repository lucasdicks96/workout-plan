import {
  CompletedWorkout,
  FlatCompletedWorkoutRow,
  FlatWorkoutRow,
  Workout,
  WorkoutExercise,
} from "../types/workout.types";

export function buildWorkout(
  workoutId: number,
  rows: FlatWorkoutRow[],
): Workout {
  const { plan_title, plan_user_id } = rows[0];

  const workout: Workout = {
    id: workoutId,
    title: plan_title,
    userId: plan_user_id,
    exercises: [],
  };

  const exerciseMap = new Map<number, WorkoutExercise>();

  rows.forEach((row) => {
    let exercise = exerciseMap.get(row.exercise_id);

    if (!exercise) {
      exercise = {
        id: row.exercise_id,
        title: row.title,
        displayOrder: row.display_order,
        sets: [],
      };
      exerciseMap.set(row.exercise_id, exercise);
    }

    if (row.set_number != null) {
      exercise.sets.push({
        setNumber: row.set_number,
        repetitions: row.repetitions,
        weight: row.weight,
      });
    }
  });

  workout.exercises = Array.from(exerciseMap.values()).sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  );

  return workout;
}

export function buildCompletedWorkouts(
  rows: FlatCompletedWorkoutRow[],
): CompletedWorkout[] {
  const workoutGroupMap = new Map<
    string,
    {
      workout: CompletedWorkout;
      exerciseMap: Map<number, WorkoutExercise>;
    }
  >();

  rows.forEach((row) => {
    const completedWorkoutId = row.workout_id;

    let workoutEntry = workoutGroupMap.get(completedWorkoutId);

    if (!workoutEntry) {
      workoutEntry = {
        workout: {
          id: completedWorkoutId,
          userId: row.plan_user_id,
          workoutId: row.plan_id,
          title: row.plan_title,
          duration: row.duration_seconds,
          startTime: row.start_time,
          endTime: row.end_time,
          pauseTime: row.pause_seconds,
          exercises: [],
        },
        exerciseMap: new Map<number, WorkoutExercise>(),
      };
      workoutGroupMap.set(completedWorkoutId, workoutEntry);
    }

    const exerciseId = row.exercise_id;
    let exercise = workoutEntry.exerciseMap.get(exerciseId);

    if (!exercise) {
      exercise = {
        id: exerciseId,
        title: row.title,
        displayOrder: row.display_order,
        sets: [],
      };
      workoutEntry.exerciseMap.set(exerciseId, exercise);
    }

    if (row.set_number != null) {
      exercise.sets.push({
        setNumber: row.set_number,
        weight: row.weight as number,
        repetitions: row.repetitions as number,
      });
    }
  });

  const completedWorkouts: CompletedWorkout[] = [];

  for (const { workout, exerciseMap } of workoutGroupMap.values()) {
    workout.exercises = Array.from(exerciseMap.values()).sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
    completedWorkouts.push(workout);
  }

  return completedWorkouts.sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime(),
  );
}

export function buildWorkoutPlansList(rows: FlatWorkoutRow[]): Workout[] {
  const plansMap = new Map<
    number,
    { workout: Workout; exerciseMap: Map<number, WorkoutExercise> }
  >();

  rows.forEach((row) => {
    let planEntry = plansMap.get(row.plan_id);

    if (!planEntry) {
      planEntry = {
        workout: {
          id: row.plan_id,
          title: row.plan_title,
          userId: row.plan_user_id,
          exercises: [],
        },
        exerciseMap: new Map<number, WorkoutExercise>(),
      };
      plansMap.set(row.plan_id, planEntry);
    }

    let exercise = planEntry.exerciseMap.get(row.exercise_id);

    if (!exercise) {
      exercise = {
        id: row.exercise_id,
        title: row.title,
        displayOrder: row.display_order,
        sets: [],
      };
      planEntry.exerciseMap.set(row.exercise_id, exercise);
    }

    exercise.sets.push({
      setNumber: row.set_number,
      weight: row.weight,
      repetitions: row.repetitions,
    });
  });

  const workouts: Workout[] = [];

  for (const { workout, exerciseMap } of plansMap.values()) {
    workout.exercises = Array.from(exerciseMap.values()).sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
    );
    workouts.push(workout);
  }

  return workouts.sort((a, b) => a.title.localeCompare(b.title));
}
