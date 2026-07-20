import axios from "axios";
import { createContext, ReactNode, useEffect, useState } from "react";
import { useNotification } from "../hooks/useNotification";
import { UserWithoutPassword } from "../schemas/user.schema";
import { apiService } from "../services/apiService";
import { getApiErrorMessage } from "../util/errorHelper";

/**
 * Definition des Inhalts vom AuthContext.
 * Bietet komponentenweiten Zugriff auf den aktuellen Benutzerstatus,
 * den initialen Ladezustand sowie die primären Authentifizierungsmethoden.
 */
export interface AuthContextType {
  /** Das Objekt des aktuell angemeldeten Benutzers oder null, wenn anonym */
  user: UserWithoutPassword | null;
  /** Gibt an, ob die Session-Prüfung beim App-Start noch aktiv ist */
  loading: boolean;
  /** Authentifiziert einen Benutzer mit E-Mail und Passwort */
  login: (email: string, password: string) => Promise<void>;
  /** Registriert ein neues Benutzerkonto und loggt dieses direkt ein */
  register: (
    email: string,
    password: string,
    turnstileToken: string,
  ) => Promise<void>;
  /** Beendet die aktuelle Session auf dem Server und leert den lokalen State */
  logout: () => Promise<void>;
}

/**
 * Der globale Context für das Authentifizierungs-Management.
 * Initialer Wert ist null, wird beim App-Start durch den Provider initialisiert.
 */
export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Provider-Komponente für das Authentifizierungs-System.
 * Kapselt den User-Status und steuert die zentralen API-Anfragen für
 * Login, Registrierung und Session-Validierung beim Start (Mount).
 *
 * @param children - Die untergeordneten Komponenten, die Zugriff auf den Auth-Status erhalten.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithoutPassword | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showNotification } = useNotification();

  /**
   * Initialer Authentifizierungs-Check beim Start der App.
   * Prüft beim ersten Laden (Mount), ob bereits eine gültige Session (z.B. via Cookie)
   * beim Server existiert. Verhindert falsche Redirects durch verzögertes Setzen von `loading`.
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await apiService.getStatus();
        setUser(response.data);
      } catch (error) {
        // Ein 401-Fehler ist ein normaler Zustand (Gast-Session), kein Systemfehler
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          console.warn("Auth Check: User nicht authentifiziert");
        } else {
          // Für alle anderen Fehler (z.B. 500, Netzwerk down) nutzen wir den Helper
          showNotification(
            getApiErrorMessage(error, "Verbindungsfehler zur API"),
            "error",
            3000,
          );
        }
        // Wird in jedem Fehlerfall ausgeführt – spart 3 redundante Aufrufe!
        setUser(null);
      } finally {
        // loading wird auf false gesetzt, sobald die Server-Antwort da ist.
        // Verhindert Flackern/falsche Redirects während der Prüfung.
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  /**
   * Meldet den Benutzer mit E-Mail und Passwort an.
   * Bei erfolgreicher Serverantwort wird das empfangene User-Objekt im State gespeichert.
   *
   * @param email - Die E-Mail-Adresse des Benutzers
   * @param password - Das Klartext-Passwort des Benutzers
   * @throws {Error} Reicht die serverseitige Fehlermeldung an die UI-Komponente weiter.
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.login({ email, password });
      setUser(response.data);
    } catch (error) {
      // 1. Helper zieht zielgenau die Backend-Message oder nimmt das Fallback

      showNotification(
        getApiErrorMessage(error, "Anmeldung fehlgeschlagen"),
        "error",
        3000,
      );
      // 2. Wir werfen die saubere Nachricht für die UI-Komponente (z.B. Login-Formular) weiter
      throw new Error("Anmeldung fehlgeschlagen");
    }
  };

  /**
   * Registriert einen neuen Benutzer im System und loggt diesen bei Erfolg sofort ein.
   * Speicher das neue User-Objekt direkt im lokalen State.
   *
   * @param email - Die gewünschte E-Mail-Adresse des neuen Benutzers
   * @param password - Das gewählte Passwort
   * @throws {Error} Reicht die serverseitige Fehlermeldung an die UI-Komponente weiter.
   */
  const register = async (
    email: string,
    password: string,
    turnstileToken: string,
  ): Promise<void> => {
    try {
      const response = await apiService.register({
        email,
        password,
        turnstileToken,
      });
      setUser(response.data);
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Registrierung fehlgeschlagen"),
        "error",
        3000,
      );
      throw new Error("Registrierung fehlgeschlagen");
    }
  };

  /**
   * Beendet die Session auf dem Server und löscht den lokalen User-State.
   * Schützt vor dem Sicherheitsrisiko eines inkonsistenten Logout-Zustands, indem
   * der lokale User-State erst nach erfolgreicher Serverbestätigung auf null gesetzt wird.
   *
   * @throws {Error} Löst einen Fehler aus, falls die Netzwerkverbindung blockiert ist.
   */
  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
      showNotification("Erfolgreich ausgeloggt", "success");
      setUser(null);
    } catch (error) {
      showNotification(
        getApiErrorMessage(error, "Logout fehlgeschlagen"),
        "error",
        3000,
      );

      throw new Error(
        "Logout fehlgeschlagen. Session auf dem Server noch aktiv.",
      );
    }
  };

  // Zusammengefasstes Value-Objekt für den Context-Provider.
  // Enthält dank des Refactorings nur noch genuine Authentifizierungsdaten.
  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
