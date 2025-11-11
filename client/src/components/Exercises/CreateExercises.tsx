import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useExercises } from "../../hooks/useExercises";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import "../../styles/global.css"; // Import global styles
import ConfirmButton from "../Buttons/ConfirmButton";
import ReturnButton from "../Buttons/ReturnButton";

type FormState = {
  title: string;
  description: string;
};

export default function CreateExercise() {
  const navigate = useNavigate();
  const {
    categoryTree,
    selectedCategories,
    handleCategorySelect,
    renderCategoryCheckboxes,
  } = useExercises();

  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
  });

  useSetTitle("Übung erstellen");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await apiService.createExercise(
        formState.title,
        formState.description,
        selectedCategories
      );
      navigate("/exercises", { replace: true });
      console.log("Exercise created successfully!");
    } catch (error) {
      console.error("Error creating exercise:", error);
    }
  };

  return (
    <div className="content">
      <form onSubmit={handleSubmit} method="POST" className="form">
        <div>
          <input
            className="input"
            type="text"
            id="title"
            value={formState.title}
            onChange={(e) =>
              setFormState({ ...formState, title: e.target.value })
            }
            placeholder="Übungsname"
            maxLength={50}
            required
          />
        </div>
        <div>
          <input
            className="input"
            type="text"
            id="description"
            value={formState.description}
            onChange={(e) =>
              setFormState({ ...formState, description: e.target.value })
            }
            placeholder="Übungsbeschreibung"
            maxLength={50}
            required
          />
        </div>
        <fieldset
          style={{
            display: "block",
            maxHeight: "250px",
            overflowY: "auto",
            borderRadius: "5px",
            padding: "10px",
          }}
          className="input"
        >
          <legend>Kategorien wählen:</legend>
          {renderCategoryCheckboxes(
            categoryTree,
            selectedCategories,
            handleCategorySelect
          )}
        </fieldset>
        <div className="button-container">
          <ReturnButton onBack={() => navigate("/exercises")} />
          <ConfirmButton btnType="submit" />
        </div>
      </form>
    </div>
  );
}
