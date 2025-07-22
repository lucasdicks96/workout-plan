import { MutableRefObject, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/apiService";
import { useAuth } from "../../context/AuthContext";
import "../../styles/global.css"; // Import global styles
import stylesLayout from "../../styles/Layout.module.css"; // Import layout styles

type FormState = {
  title: string;
  description: string;
  uid: MutableRefObject<number>;
};

export default function CreateExercise() {
  const uid = useRef(0);
  const { user } = useAuth();

  useEffect(() => {
    async function fetchId() {
      try {
        if (!user || user.id === undefined || user.id === null) {
          console.error("User is not logged in or does not have an ID.");
          return;
        }
        uid.current = user.id;
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    }
    fetchId();
  }, [user]);

  const [formState, setFormState] = useState<FormState>({
    title: "",
    description: "",
    uid: uid,
  });

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
      await apiService.createExercise(
        formState.title,
        formState.description,
        formState.uid.current
      );
      navigate("/exercises", { replace: true });
      console.log("Exercise created successfully!");
    } catch (error) {
      console.error("Error creating exercise:", error);
    }
  };

  return (
    <div className="content">
      <h2 className={stylesLayout.pageTitle}>Create Exercise</h2>
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
          <button className="button" type="submit">
            Erstellen
          </button>
          <button
            className="button"
            type="button"
            onClick={() => navigate("/exercises")}
          >
            Zurück
          </button>
        </div>
      </form>
    </div>
  );
}
