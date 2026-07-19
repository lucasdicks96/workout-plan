import { AxiosError } from "axios";
import { FormEvent, useEffect, useState } from "react";
import { useExercises } from "../../hooks/useExercises";
import { useNotification } from "../../hooks/useNotification";
import { apiService } from "../../services/apiService";
import stylesExercises from "../../styles/Exercise.module.css";
import styles from "../../styles/Modal.module.css";
import { Category, Exercise } from "../../types/exercises";
import ConfirmButton from "../Buttons/ConfirmButton";
import DeleteButton from "../Buttons/DeleteButton";
import ReturnButton from "../Buttons/ReturnButton";
import { getApiErrorMessage } from "../../util/errorHelper";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  exerciseData: Exercise;
  onUpdateSuccess: () => void;
};
type FormState = {
  title: string;
  id: number;
  description: string;
};

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

  const { showNotification } = useNotification();

  const [deleteIsOpen, setDeleteIsOpen] = useState(false);

  const {
    categoryTree,
    selectedCategories,
    setSelectedCategories,
    handleCategorySelect,
    renderCategoryCheckboxes,
  } = useExercises();

  useEffect(() => {
    if (isOpen && exerciseData) {
      setFormState({
        title: exerciseData.title,
        id: exerciseData.id,
        description: exerciseData.description,
      });

      const catIds = exerciseData.category?.map((c: Category) => c.id) ?? [];
      setSelectedCategories(catIds);
    }
  }, [isOpen, exerciseData, setSelectedCategories]);

  if (!isOpen) {
    return null;
  }

  const onDelete = async (id: number) => {
    const deleteId = id ?? formState.id;
    console.log(`Deleting exercise: ${deleteId}`);
    try {
      await apiService.deleteExercise(deleteId);

      showNotification("Übung erfolgreich gelöscht", "success");
      onUpdateSuccess();
      onClose();
    } catch (error: unknown) {
      showNotification(
        getApiErrorMessage(error, "Die Übung konnte nicht gelöscht werden."),
        "error",
        3000,
      );
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await apiService.putExercise({
        id: formState.id,
        title: formState.title,
        description: formState.description,
        categories: selectedCategories,
      });

      showNotification("Übung erfolgreich aktualisiert", "success");
      onUpdateSuccess();
      onClose();
    } catch (error: unknown) {
      showNotification(
        getApiErrorMessage(error, "Die Übung konnte nicht gespeichert werden"),
        "error",
        3000,
      );
    }
  };
  return (
    <div
      className={stylesExercises["exercise-list"]}
      style={{ position: "relative" }}
    >
      <div className={styles.backdrop} onClick={onClose} />

      <form className="form" onSubmit={onSubmit}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div>
            <input
              value={formState.title}
              className="input"
              type="text"
              name="title"
              onChange={onChange}
            />
            <div>
              <input
                value={formState.description}
                className="input"
                type="text"
                name="description"
                onChange={onChange}
              />
            </div>
          </div>
          <fieldset
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              border: "1px solid #ccc",
              padding: "0.75rem",
              marginTop: "1rem",
            }}
          >
            <legend>Kategorien bearbeiten:</legend>
            {renderCategoryCheckboxes(
              categoryTree,
              selectedCategories,
              handleCategorySelect,
            )}
          </fieldset>
          <div className="button-container">
            {deleteIsOpen && (
              <DeleteButton
                isOpen={deleteIsOpen}
                onDelete={() => {
                  onDelete(formState.id);
                  setDeleteIsOpen(false);
                }}
                onToggleVisibility={setDeleteIsOpen}
              />
            )}
            {!deleteIsOpen && (
              <>
                <ReturnButton onBack={onClose} />
                <DeleteButton
                  isOpen={deleteIsOpen}
                  onDelete={() => {
                    onDelete(formState.id);
                    setDeleteIsOpen(false);
                  }}
                  onToggleVisibility={setDeleteIsOpen}
                />
                <ConfirmButton btnType="submit" />
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
