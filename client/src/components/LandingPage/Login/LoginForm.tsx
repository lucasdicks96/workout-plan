// import React from "react";
// import ReactDOM from "react-dom/client";
// import styles form "./LoginForm.module.css";
import { useState } from "react";
import styles from "./LoginForm.module.css";

type FormState = {
  username: string;
  password: string;
};
export default function LoginForm() {
  const [formState, setFormState] = useState<FormState>({
    username: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Username: ", formState.username);
    console.log("Password: ", formState.password);
    setFormState({
      username: "",
      password: "",
    });
  };
  return (
    <>
      <form className={styles.login_form} onSubmit={handleSubmit}>
        <h2>Login</h2>
        <div>
          <label htmlFor="username">Username</label>
        </div>
        <button type="submit">Login</button>
      </form>
    </>
  );
}
