import axios from "axios";
import { useEffect, useState, useRef, MutableRefObject } from "react";
import { useNavigate } from "react-router-dom";

type FormState = {
  title: string;
  description: string;
  uid: MutableRefObject<number>;
};

export default function CreateExercise() {
  const uid = useRef(0);
  useEffect(() => {
    async function fetchId() {
      const response = await axios.get("http://localhost:5000/user/id", {
        withCredentials: true,
      });
      console.log(response.data.uid);
      uid.current = response.data.uid;
    }
    fetchId();
  });
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
      const response = await axios.post(
        `http://localhost:5000/exercise/create-exercise`,
        {
          title: formState.title,
          description: formState.description,
          user_id: uid,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Created exercise!");
      response.status === 201
        ? navigate("/users/exercises")
        : navigate("/users");
    } catch (error) {
      console.error(error);
      console.log("Failed to create exercise");
    }
  };

  return (
    <>
      <h2>Create Exercise</h2>
      <form onSubmit={handleSubmit} method="POST">
        <div>
          <input
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
            type="text"
            id="description"
            value={formState.description}
            onChange={handleChange}
            placeholder="Exercise Description"
            maxLength={50}
            required
          />
        </div>
        <button type="submit">Submit</button>
      </form>
    </>
  );
}
