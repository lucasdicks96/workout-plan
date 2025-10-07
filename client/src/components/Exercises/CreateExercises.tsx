import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/apiService";
import "../../styles/global.css"; // Import global styles
import { useSetTitle } from "../../hooks/useSetTitle";

type FormState = {
  title: string;
  description: string;
};

export default function CreateExercise() {
  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
  });

  useSetTitle("Übung erstellen");

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormState((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await apiService.createExercise(formState.title, formState.description);
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
            onChange={handleChange}
            placeholder="Exercise Name"
            maxLength={15}
            required
          />
        </div>
        <div>
          <input
            className="input"
            type="text"
            id="description"
            value={formState.description}
            onChange={handleChange}
            placeholder="Exercise Description"
            maxLength={50}
            required
          />
        </div>
        <div className="button-container">
          <button
            className="button"
            type="button"
            onClick={() => navigate("/exercises")}
          >
            Zurück
          </button>
          <button className="button" type="submit">
            Erstellen
          </button>
        </div>
      </form>
    </div>
  );
}
