import { useState, useEffect, FormEvent } from "react";
import { apiService } from "../services/apiService";
import "../styles/global.css";
import styles from "../styles/Modal.module.css";
import { CombinedExercise } from "../types/exercises";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  exerciseData: CombinedExercise;
  userId: number;
};
type FormState = {
  title: string;
  description: string;
};

export default function Modal({
  isOpen,
  exerciseData,
  onClose,
  userId,
}: ModalProps) {
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormState({
        title: exerciseData.title,
        description: exerciseData.description,
      });
    }
  }, [isOpen, exerciseData]);

  if (!isOpen) {
    return null;
  }

  const handleDelete = async () => {
    console.log(`Deleting exercise: ${exerciseData.originalId}`);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await apiService.editExercise(
        exerciseData.originalId,
        formState.title,
        formState.description,
        userId
      );
      console.log(response);
      if (response.status === 200) {
        console.log("Exercise updated successfully!", response.data);
        onClose();
      } else {
        console.error("Failed to update exercise");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Error updating exercise:", err.message);
      } else {
        console.error("Error updating exercise:", err);
      }
    }
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <form
        className="form"
        method="PUT"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modal}>
          <div>
            <input
              value={formState.title}
              className="input"
              type="text"
              id="title"
              maxLength={15}
              onChange={handleChange}
            />
            <input
              value={formState.description}
              className="input"
              type="text"
              id="description"
              maxLength={50}
              onChange={handleChange}
            />
          </div>
          <div className="button-container">
            <button className="button" type="submit">
              OK
            </button>
            <button className="button" onClick={onClose} type="button">
              Zurück
            </button>
          </div>
          <div className="button-container">
            <button className="button" onClick={handleDelete} type="button">
              Löschen
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
