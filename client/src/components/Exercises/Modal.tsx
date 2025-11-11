import { FormEvent, useEffect, useState, useRef } from "react";
import { apiService } from "../../services/apiService";
import styles from "../../styles/Modal.module.css";
import stylesExercises from "../../styles/Exercise.module.css";
import { CombinedExercise, Category } from "../../types/exercises";
import Popup from "../Popup";
import { PopupRef } from "../Popup";
import DeleteButton from "../Buttons/DeleteButton";
import ConfirmButton from "../Buttons/ConfirmButton";
import ReturnButton from "../Buttons/ReturnButton";
import { useExercises } from "../../hooks/useExercises";

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

  const popupRef = useRef<PopupRef>(null);

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
      const response = await apiService.deleteExercise(deleteId);

      popupRef.current?.show(response.data.message, response.status);
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error instanceof Error) {
          popupRef.current?.show(
            error.message || "Ein Fehler ist aufgetreten",
            500
          );
        }
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
      const response = await apiService.editExercise(
        formState.id,
        formState.title,
        formState.description,
        selectedCategories
      );

      popupRef.current?.show(response.data.message, response.status);
    } catch (error: unknown) {
      if (error instanceof Error) {
        popupRef.current?.show(
          error.message || "Ein Fehler ist aufgetreten",
          500
        );
      }
    }
  };
  const handlePopupClose = () => {
    onUpdateSuccess();
    onClose();
  };

  return (
    <div
      className={stylesExercises.exerciseList}
      style={{ position: "relative" }}
    >
      <div className={styles.backdrop} onClick={onClose} />

      <form className="form" onSubmit={onSubmit}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <Popup ref={popupRef} duration={1500} onClose={handlePopupClose} />
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
              handleCategorySelect
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
