// import React from "react";
// import ReactDOM from "react-dom/client";
// import styles form "./LoginForm.module.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./Form.module.css";
import stylesLandingPage from "../LandingPage.module.css";

type FormState = {
  email: string;
  password: string;
};

interface FormProps {
  route: string;
  buttonName: string;
}

export default function Form({ route, buttonName }: FormProps) {
  const [formState, setFormState] = useState<FormState>({
    email: "",
    password: "",
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
    console.log("Email: ", formState.email);
    console.log("Password: ", formState.password);

    try {
      const response = await axios.post(
        `http://localhost:5000/user/${route}`,
        {
          email: formState.email,
          password: formState.password,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        navigate("/users");
      }
    } catch (error) {
      console.error(`${buttonName} failed `, error);
    }

    setFormState({
      email: "",
      password: "",
    });
  };
  return (
    <div className={stylesLandingPage.body}>
      <div className={stylesLandingPage.content}>
        <div className={styles.formContainer}>
          <form
            className={styles.loginForm}
            onSubmit={handleSubmit}
            method="POST"
          >
            <h2>{buttonName}</h2>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Username:</label>
              <input
                type="email"
                id="email"
                value={formState.email}
                onChange={handleChange}
                className={styles.input}
                placeholder={"email"}
                required
              ></input>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="password">Passwort:</label>
              <input
                type="password"
                id="password"
                value={formState.password}
                onChange={handleChange}
                className={styles.input}
                placeholder={"password"}
                required
              />
            </div>

            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.button}>
                {buttonName}
              </button>
              <Link to="/" className={styles.linkButton}>
                Close
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
