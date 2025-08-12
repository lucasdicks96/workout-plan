import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
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
        navigate("/dashboard", { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authBox}>
        <h1 className={styles.authTitle}>Fitness Tracker</h1>
        <div className={styles.authTabs}>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `${styles.authTab} ${isActive ? styles.authTabActive : ""}`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              `${styles.authTab} ${isActive ? styles.authTabActive : ""}`
            }
          >
            Registrieren
          </NavLink>
        </div>
        <form onSubmit={handleAuth} className={styles.authForm}>
          <div>
            <label className={styles.authLabel}>E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <label className={styles.authLabel}>Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              required
            />
          </div>
          {error && <p className={styles.authError}>{error}</p>}
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
