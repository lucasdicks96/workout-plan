import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import styles from "../../styles/AuthPage.module.css";
import "../../styles/global.css";

function AuthPage({ isRegister = false }: { isRegister?: boolean }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Da der AuthContext bereits einen sauberen Error wirft,
      // müssen wir hier nur noch die Message auslesen!
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ein unerwarteter Fehler ist aufgetreten.");
      }
    }
  };

  return (
    <div className={styles["auth-page"]}>
      <div className={styles["auth-box"]}>
        <h1 className={styles["auth-title"]}>Fitness Tracker</h1>
        <div className={styles["auth-tabs"]}>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `${styles["auth-tab"]} ${isActive ? styles["auth-tab-active"] : ""}`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              `${styles["auth-tab"]} ${isActive ? styles["auth-tab-active"] : ""}`
            }
          >
            Registrieren
          </NavLink>
        </div>
        <form onSubmit={handleAuth} className={styles["auth-form"]}>
          <div>
            <label className={styles["auth-label"]}>E-Mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className={styles["auth-label"]}>Passwort</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          {error && <p className={styles["auth-error"]}>{error}</p>}
          <div>
            <button type="submit" className="button">
              {isRegister ? "Konto erstellen" : "Einloggen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AuthPage;
