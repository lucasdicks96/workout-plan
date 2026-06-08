import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios"; // WICHTIG: Hinzugefügt für sicheres Error-Handling
import { useExercises } from "../../hooks/useExercises";
import { useSetTitle } from "../../hooks/useSetTitle";
import { apiService } from "../../services/apiService";
import "../../styles/global.css";
import ConfirmButton from "../Buttons/ConfirmButton";
import ReturnButton from "../Buttons/ReturnButton";
import { useNotification } from "../../hooks/useNotification";

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

  const { showNotification } = useNotification();

  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
  });

  useSetTitle("Übung erstellen");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await apiService.postExercise({
        title: formState.title,
        description: formState.description,
        categories: selectedCategories,
      });
      navigate("/exercises", { replace: true });
    } catch (error) {
      // 1. Prüfen, ob es ein Fehler direkt von der API (Axios) ist
      if (isAxiosError(error) && error.response) {
        // error.response.data ist genau dein { status: "fail", message: "..." } JSON aus dem Backend!
        const backendMessage =
          error.response.data.message || "Fehler beim Erstellen der Übung";
        showNotification(backendMessage, "error", 3000);
      }
      // 2. Fallback für Netzwerkfehler (Server offline, etc.) oder allgemeine JS Fehler
      else if (error instanceof Error) {
        showNotification(error.message, "error", 3000);
      }
      // 3. Wenn absolut gar nichts mehr geht
      else {
        showNotification(
          "Ein unbekannter Fehler ist aufgetreten.",
          "error",
          3000,
        );
      }

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
            name="title"
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
            name="description"
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
            handleCategorySelect,
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
