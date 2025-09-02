import { useState } from "react";
import {
  WorkoutExerciseSets,
  WorkoutExercises as WorkoutExercisesType,
} from "../types/workouts";
import { CombinedExercise } from "../types/exercises";

export function useWorkoutManager(
  initialWorkoutList: WorkoutExercisesType[] = []
) {
  const [workoutList, setWorkoutList] =
    useState<WorkoutExercisesType[]>(initialWorkoutList);
  const [isSelecting, setIsSelecting] = useState(false);

  const updateExerciseInWorkout = (
    key: string,
    setIdx: number,
    field: keyof WorkoutExerciseSets,
    value: number
  ) => {
    setWorkoutList((current) =>
      current.map((ex) =>
        ex.compositeKey === key
          ? {
              ...ex,
              sets: ex.sets.map((set, idx) =>
                idx === setIdx ? { ...set, [field]: value } : set
              ),
            }
          : ex
      )
    );
  };

  const handleAddSet = (key: string) => {
    setWorkoutList((current) =>
      current.map((ex) =>
        ex.compositeKey === key
          ? {
              ...ex,
              sets: [
                ...ex.sets,
                {
                  setNumber: ex.sets.length + 1,
                  repetitions: 10,
                  weight: 10,
                },
              ],
            }
          : ex
      )
    );
  };

  const handleRemoveSet = (key: string) => {
    setWorkoutList((current) =>
      current.map((ex) => {
        if (ex.compositeKey === key && ex.sets.length > 1) {
          return {
            ...ex,
            sets: ex.sets.slice(0, -1),
          };
        }
        return ex;
      })
    );
  };

  const removeExerciseFromWorkout = (key: string) => {
    setWorkoutList((current) =>
      current.filter((ex) => ex.compositeKey !== key)
    );
  };

  const addExerciseToWorkout = (exercise: CombinedExercise) => {
    const newWorkoutExercise: WorkoutExercisesType = {
      ...exercise,
      sets: [
        {
          setNumber: 1,
          repetitions: 10,
          weight: 10,
        },
      ],
    };
    setWorkoutList((current) => [...current, newWorkoutExercise]);
    setIsSelecting(false);
  };

  return {
    workoutList,
    setWorkoutList,
    isSelecting,
    setIsSelecting,
    updateExerciseInWorkout,
    handleAddSet,
    handleRemoveSet,
    removeExerciseFromWorkout,
    addExerciseToWorkout,
  };
}
