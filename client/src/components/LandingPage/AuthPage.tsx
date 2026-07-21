import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";
import { useAuth } from "../../hooks/useAuth";
import styles from "../../styles/AuthPage.module.css";
import "../../styles/global.css";

/**
 * Die Eigenschaften (Props) für die AuthPage-Komponente.
 */
interface AuthPageProps {
  /** Gibt an, ob sich die Seite im Registrierungs-Modus (`true`) oder im Login-Modus (`false`) befindet. Standard: false */
  isRegister?: boolean;
}

/**
 * Eine zentrale Authentifizierungsseite für Login und Registrierung.
 *
 * Versteuert die Formulareingaben für E-Mail und Passwort und bindet im Registrierungs-Modus
 * automatisch das Cloudflare Turnstile Widget zur Bot-Abwehr ein. Nach erfolgreicher Authentifizierung
 * erfolgt eine automatische Weiterleitung zum Dashboard.
 *
 * @param {AuthPageProps} props - Die Eigenschaften der Komponente.
 * @returns {JSX.Element} Die gerenderte Authentifizierungsbox mit Tabs und Formular.
 */
function AuthPage({ isRegister = false }: AuthPageProps) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /** Speichert den erfolgreichen Cloudflare Turnstile Bot-Abwehr-Token (wird nur bei der Registrierung benötigt). */
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const allowRegistration = import.meta.env.DEV;

  const navigate = useNavigate();

  /**
   * Verarbeitet den Absende-Vorgang des Formulars (Login oder Registrierung):
   * - Bei Registrierung: Prüft, ob der Turnstile-Token vorliegt, und ruft `register` auf.
   * - Bei Login: Ruft direkt die `login`-Funktion auf.
   * - Navigiert bei Erfolg zum Dashboard.
   *
   * @async
   * @param {React.FormEvent<HTMLFormElement>} e - Das Formular-Submit-Event.
   * @returns {Promise<void>}
   */
  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister && allowRegistration) {
        // Sicherstellen, dass der Token vorhanden ist, bevor die Registrierung abgeschickt wird
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
        <>
          {/* Navigation-Tabs zwischen Login und Registrierung */}
          {allowRegistration ? (
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
          ) : (
            <NavLink to="/login" className={`${styles["auth-tab"]}`}></NavLink>
          )}
        </>

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

          {/* Cloudflare Turnstile-Widget (wird ausschließlich im Registrierungs-Modus angezeigt) */}
          {isRegister && allowRegistration && (
            <div
              style={{
                margin: "16px 0",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || ""}
                onSuccess={(token) => {
                  setTurnstileToken(token);
                  setError(""); // Eventuelle "Token fehlt"-Fehlermeldungen beim Erfolg löschen
                }}
                onError={() =>
                  setError("Bot-Schutz konnte nicht geladen werden.")
                }
                onExpire={() => setTurnstileToken(null)}
              />
            </div>
          )}

          {error && <p className={styles["auth-error"]}>{error}</p>}

          <div>
            {/* Submit-Button: Wird während der Registrierung blockiert, solange der Turnstile-Token noch fehlt */}
            <button
              type="submit"
              className="button"
              disabled={isRegister && !turnstileToken}
              style={
                isRegister && !turnstileToken
                  ? { opacity: 0.6, cursor: "not-allowed" }
                  : undefined
              }
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
