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
    setWorkoutList((current) => {
      const newList = current.filter((ex) => ex.compositeKey !== key);
      return updateDisplayOrder(newList);
    });
  };

  function updateDisplayOrder(workoutExercises: WorkoutExercisesType[]) {
    return workoutExercises.map((ex, idx) => ({
      ...ex,
      displayOrder: idx,
    }));
  }

  const reorderWorkoutList = (newList: WorkoutExercisesType[]) => {
    setWorkoutList(updateDisplayOrder(newList));
  };

  const addExerciseToWorkout = (exercise: CombinedExercise) => {
    setWorkoutList((current) => {
      const newList = [
        ...current,
        {
          ...exercise,
          displayOrder: current.length,
          sets: [{ setNumber: 1, repetitions: 10, weight: 10 }],
        },
      ];
      return updateDisplayOrder(newList);
    });
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
    updateDisplayOrder,
    reorderWorkoutList,
  };
}
