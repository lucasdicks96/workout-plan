import { FormEvent, useEffect, useState } from "react";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Modal.module.css";
import stylesExercises from "../../styles/Exercise.module.css";
import { CombinedExercise } from "../../types/exercises";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  exerciseData: CombinedExercise;
  onUpdateSuccess: () => void;
};
type FormState = {
  title: string;
  id: number;
  description: string;
};

type PopupState = {
  message: string;
  isOpen: boolean;
  status: number;
};

function Popup({ message, status }: { message: string; status: number }) {
  const style: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "1.25rem",
    borderRadius: "0.5rem",
    backgroundColor:
      status === 200 || status === 204 ? "var(--c-primary)" : "var(--c-danger)",
    color: "var(--c-text-primary)",
    zIndex: 100,
    textAlign: "center",
    fontWeight: "bold",
  };
  return <div style={style}>{message}</div>;
}

export default function Modal({
  isOpen,
  exerciseData,
  onClose,
  onUpdateSuccess,
}: ModalProps) {
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    id: 0,
  });

  const [popupState, setPopupState] = useState<PopupState>({
    message: "",
    isOpen: false,
    status: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setFormState({
        title: exerciseData.title,
        id: exerciseData.id,
        description: exerciseData.description,
      });
      setPopupState({ message: "", isOpen: false, status: 0 });
    }
  }, [isOpen, exerciseData]);

  useEffect(() => {
    if (popupState.isOpen) {
      const timer = setTimeout(() => {
        setPopupState({ ...popupState, isOpen: false });
        onUpdateSuccess();
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [popupState, onClose, onUpdateSuccess]);

  if (!isOpen) {
    return null;
  }

  const onDelete = async () => {
    console.log(`Deleting exercise: ${formState.id}`);
    try {
      const response = await apiService.deleteExercise(formState.id);

      setPopupState({
        message: response.data.message,
        isOpen: true,
        status: response.status,
      });
      console.log(response.data);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setPopupState({
          message: error.message || "Ein Fehler ist aufgetreten",
          isOpen: true,
          status: 500,
        });
      }
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      console.log("ON SUBMIT ORIGINALID", exerciseData.id);
      console.log("ON SUBMIT TITLE", exerciseData.title);
      if (!formState.title.trim())
        return setPopupState({
          message: "Title erforderlich",
          isOpen: true,
          status: 400,
        });
      const response = await apiService.editExercise(
        formState.id,
        formState.title,
        formState.description
      );
      setPopupState({
        message: response.data.message,
        isOpen: true,
        status: response.status,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setPopupState({
          message: error.message || "Ein Fehler ist aufgetreten",
          isOpen: true,
          status: 500,
        });
      }
    }
  };

  return (
    <div className={stylesExercises.exerciseList}>
      <div className={styles.backdrop} onClick={onClose} />
      {popupState.isOpen ? (
        <Popup message={popupState.message} status={popupState.status} />
      ) : (
        <form className="form" onSubmit={onSubmit}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.closeButton}
              onClick={onClose}
              type="button"
            >
              x
            </button>
            <div>
              <input
                value={formState.title}
                className="input"
                type="text"
                id="title"
                onChange={onChange}
              />
              <input
                value={formState.description}
                className="input"
                type="text"
                id="description"
                onChange={onChange}
              />
            </div>
            <div className="button-container">
              <button className="button" type="submit">
                OK
              </button>
              <button className="button" onClick={onDelete} type="button">
                Löschen
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
