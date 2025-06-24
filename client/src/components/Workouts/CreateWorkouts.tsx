import { useEffect, useMemo, useState } from "react";
import { fetchAllExercises } from "../../api/fetchExercise";
import { IExerciseForWorkout, IExercisesList } from "../../types/exercises";
import Exercise from "../Exercises/Exercises";
import ExerciseSelectionList from "../Exercises/ExerciseSelectionList"; // Importiere die ExerciseSelectionList Komponente
import Modal from "../Modal";
import { WorkoutList } from "../Workouts/WorkoutList"; // Importiere die WorkoutList Komponente

export default function CreateWorkout() {
  const [exerciseList, setExerciseList] = useState<IExercisesList[]>([]);
  const [workoutList, setWorkoutList] = useState<IExerciseForWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [exerciseForModal, setExerciseForModal] = useState<
    IExercisesList | IExerciseForWorkout | null
  >(null);

  useEffect(() => {
    const loadAllExercises = async () => {
      try {
        const exercises = await fetchAllExercises();
        setExerciseList(exercises);
      } catch (error) {
        console.error("Fehler beim Abrufen der Übungen:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAllExercises();
  }, []);

  // Ein Set mit den IDs der bereits im Workout vorhandenen Übungen für schnelle Überprüfung
  const existingExerciseIds = useMemo(
    () => new Set(workoutList.map((ex) => ex.id)),
    [workoutList]
  );

  const handleRemoveExercise = (exerciseId: number) => {
    setWorkoutList((prevList) =>
      prevList.filter((exercise) => exercise.id !== exerciseId)
    );
  };

  const handleSaveExercise = (exerciseData: IExerciseForWorkout) => {
    const exists = existingExerciseIds.has(exerciseData.id);

    if (exists) {
      // Übung aktualisieren
      setWorkoutList((prevList) =>
        prevList.map((ex) => (ex.id === exerciseData.id ? exerciseData : ex))
      );
    } else {
      // Neue Übung hinzufügen
      setWorkoutList((prevList) => [...prevList, exerciseData]);
    }
  };

  // Öffnet das Modal für eine NEUE Übung aus der Auswahlliste
  const handleSelectNewExercise = (exercise: IExercisesList) => {
    // Verhindere Klick, wenn Übung schon existiert
    if (existingExerciseIds.has(exercise.id)) {
      return;
    }
    setExerciseForModal(exercise);
    setShowExerciseSelection(false); // Zurück zur Plan-Ansicht
  };

  // Öffnet das Modal zum BEARBEITEN einer Übung aus dem Workout-Plan
  const handleEditExercise = (exercise: IExerciseForWorkout) => {
    setExerciseForModal(exercise);
  };

  const handleCloseModal = () => {
    setExerciseForModal(null);
  };

  return (
    <>
      {isLoading ? (
        "Is loading..."
      ) : (
        <>
          {showExerciseSelection ? (
            <ExerciseSelectionList
              exerciseList={exerciseList}
              existingExerciseIds={existingExerciseIds}
              handleSelectNewExercise={handleSelectNewExercise}
              setShowExerciseSelection={setShowExerciseSelection}
            />
          ) : (
            <>
              <h2>Dein aktueller Trainingsplan</h2>
              <WorkoutList
                workoutList={workoutList}
                onEditExercise={handleEditExercise}
                onRemoveExercise={handleRemoveExercise}
              />
              <button onClick={() => setShowExerciseSelection(true)}>
                <span>+</span> Übung hinzufügen
              </button>
            </>
          )}
          {exerciseForModal && (
            <Modal onClose={handleCloseModal}>
              <Exercise
                exercise={exerciseForModal}
                onSave={handleSaveExercise} // Immer die gleiche Speicherfunktion
                onClose={handleCloseModal}
              />
            </Modal>
          )}
        </>
      )}
    </>
  );
}
