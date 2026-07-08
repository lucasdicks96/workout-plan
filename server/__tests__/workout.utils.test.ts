import { describe, expect, it } from "@jest/globals";

import {
  FlatCompletedWorkoutRow,
  FlatWorkoutRow,
} from "../src/types/workout.types";
import {
  buildCompletedWorkouts,
  buildWorkout,
  buildWorkoutPlansList,
} from "../src/utils/workout.utils";

describe("Workout Mapper Unit Tests", () => {
  describe("buildWorkout", () => {
    it("sollte flache DB-Zeilen in ein Workout-Objekt gruppieren und Übungen nach displayOrder sortieren", () => {
      // Arrange
      const rows: FlatWorkoutRow[] = [
        {
          plan_id: 1,
          plan_title: "Push Day",
          plan_user_id: "user123",
          exercise_id: 2,
          title: "Trizepsdrücken",
          display_order: 2, // Sollte als zweites kommen
          set_number: 1,
          repetitions: 12,
          weight: 30,
        },
        {
          plan_id: 1,
          plan_title: "Push Day",
          plan_user_id: "user123",
          exercise_id: 1,
          title: "Bankdrücken",
          display_order: 1, // Sollte als erstes kommen
          set_number: 1,
          repetitions: 10,
          weight: 80,
        },
        {
          plan_id: 1,
          plan_title: "Push Day",
          plan_user_id: "user123",
          exercise_id: 1,
          title: "Bankdrücken",
          display_order: 1,
          set_number: 2, // Zweites Set für Bankdrücken
          repetitions: 8,
          weight: 85,
        },
      ];

      // Act
      const result = buildWorkout(1, rows);

      // Assert
      expect(result.id).toBe(1);
      expect(result.title).toBe("Push Day");
      expect(result.exercises.length).toBe(2);

      // Prüfe korrekte Sortierung nach displayOrder
      expect(result.exercises[0].id).toBe(1);
      expect(result.exercises[0].title).toBe("Bankdrücken");
      expect(result.exercises[1].id).toBe(2);

      // Prüfe korrekte Verschachtelung der Sets
      expect(result.exercises[0].sets.length).toBe(2);
      expect(result.exercises[0].sets[1].weight).toBe(85);
    });
  });

  describe("buildCompletedWorkouts", () => {
    it("sollte durchgeführte Workouts gruppieren und absteigend nach Datum sortieren", () => {
      // Arrange
      const dateOld = new Date("2026-01-01T10:00:00Z");
      const dateNew = new Date("2026-01-02T10:00:00Z");

      const rows: FlatCompletedWorkoutRow[] = [
        {
          workout_id: "uuid-alt",
          plan_user_id: "user123",
          plan_id: 1,
          plan_title: "Alter Plan",
          duration_seconds: 3600,
          start_time: dateOld,
          end_time: new Date("2026-01-01T11:00:00Z"),
          pause_seconds: 300,
          exercise_id: 1,
          title: "Squat",
          display_order: 1,
          set_number: 1,
          weight: 100,
          repetitions: 5,
        },
        {
          workout_id: "uuid-neu",
          plan_user_id: "user123",
          plan_id: 2,
          plan_title: "Neuer Plan",
          duration_seconds: 4000,
          start_time: dateNew, // Dieses Workout ist neuer
          end_time: new Date("2026-01-02T11:00:00Z"),
          pause_seconds: 400,
          exercise_id: 2,
          title: "Deadlift",
          display_order: 1,
          set_number: 1,
          weight: 120,
          repetitions: 5,
        },
      ];

      // Act
      const result = buildCompletedWorkouts(rows);

      // Assert
      expect(result.length).toBe(2);
      // Prüfe Sortierung (Neuestes zuerst)
      expect(result[0].id).toBe("uuid-neu");
      expect(result[1].id).toBe("uuid-alt");

      // Prüfe korrekte Verschachtelung beim ersten Element
      expect(result[0].exercises.length).toBe(1);
      expect(result[0].exercises[0].sets[0].weight).toBe(120);
    });
  });

  describe("buildWorkoutPlansList", () => {
    it("sollte mehrere Trainingspläne gruppieren und alphabetisch nach Titel sortieren", () => {
      // Arrange
      const rows: FlatWorkoutRow[] = [
        {
          plan_id: 2,
          plan_title: "Zebra Workout", // Sollte als zweites kommen
          plan_user_id: "user123",
          exercise_id: 1,
          title: "Pullups",
          display_order: 1,
          set_number: 1,
          repetitions: 10,
          weight: 0,
        },
        {
          plan_id: 1,
          plan_title: "Affen Workout", // Sollte als erstes kommen
          plan_user_id: "user123",
          exercise_id: 2,
          title: "Pushups",
          display_order: 1,
          set_number: 1,
          repetitions: 20,
          weight: 0,
        },
        {
          plan_id: 1,
          plan_title: "Affen Workout",
          plan_user_id: "user123",
          exercise_id: 2,
          title: "Pushups",
          display_order: 1,
          set_number: 2, // Zweites Set für Plan 1
          repetitions: 15,
          weight: 0,
        },
      ];

      // Act
      const result = buildWorkoutPlansList(rows);

      // Assert
      expect(result.length).toBe(2);

      // Prüfe alphabetische Sortierung
      expect(result[0].title).toBe("Affen Workout");
      expect(result[1].title).toBe("Zebra Workout");

      // Prüfe korrekte Zuweisung der Sets
      expect(result[0].exercises[0].sets.length).toBe(2);
      expect(result[1].exercises[0].sets.length).toBe(1);
    });

    it("sollte ein leeres Array zurückgeben, wenn keine Rows übergeben werden", () => {
      // Arrange
      const rows: FlatWorkoutRow[] = [];

      // Act
      const result = buildWorkoutPlansList(rows);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
