import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile"; // 1. Turnstile importieren
import { useAuth } from "../../hooks/useAuth";
import styles from "../../styles/AuthPage.module.css";
import "../../styles/global.css";

function AuthPage({ isRegister = false }: { isRegister?: boolean }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // 2. State für den Turnstile-Token
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        // Sicherstellen, dass der Token vorhanden ist, bevor wir senden
        if (!turnstileToken) {
          setError("Bitte warte kurz, bis der Bot-Schutz geladen ist.");
          return;
        }
        // Token an die register-Funktion übergeben
        await register(email, password, turnstileToken);
      } else {
        await login(email, password);
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
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

          {/* 3. Turnstile-Widget nur beim Registrieren anzeigen */}
          {isRegister && (
            <div style={{ margin: "16px 0", display: "flex", justifyContent: "center" }}>
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setError(""); // Eventuelle "Token fehlt" Fehler löschen
                }}
                onError={() => setError("Bot-Schutz konnte nicht geladen werden.")}
                onExpire={() => setTurnstileToken(null)}
              />
            </div>
          )}

          {error && <p className={styles["auth-error"]}>{error}</p>}
          <div>
            {/* Button beim Registrieren deaktivieren, solange noch kein Token da ist */}
            <button 
              type="submit" 
              className="button"
              disabled={isRegister && !turnstileToken}
              style={isRegister && !turnstileToken ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              {isRegister ? "Konto erstellen" : "Einloggen"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default AuthPage;