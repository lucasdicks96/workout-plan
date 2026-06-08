import axios from "axios";
import { createContext, ReactNode, useEffect, useState } from "react";
import { useNotification } from "../hooks/useNotification";
import { apiService } from "../services/apiService";
import { User } from "../types/user";

/**
 * Definition des Inhalts vom AuthContext.
 * Bietet komponentenweiten Zugriff auf den aktuellen Benutzerstatus,
 * den initialen Ladezustand sowie die primären Authentifizierungsmethoden.
 */
export interface AuthContextType {
  /** Das Objekt des aktuell angemeldeten Benutzers oder null, wenn anonym */
  user: User | null;
  /** Gibt an, ob die Session-Prüfung beim App-Start noch aktiv ist */
  loading: boolean;
  /** Authentifiziert einen Benutzer mit E-Mail und Passwort */
  login: (email: string, password: string) => Promise<void>;
  /** Registriert ein neues Benutzerkonto und loggt dieses direkt ein */
  register: (email: string, password: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
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
        if (axios.isAxiosError(error)) {
          // Ein 401-Fehler ist ein erwartbarer Zustand, wenn keine Session vorliegt
          if (error.response?.status === 401) {
            console.warn("Auth Check: User nicht authentifiziert");
            setUser(null);
          } else {
            console.error(
              "Fehler beim Auth Check:",
              error.response?.data?.message || error.message,
            );
            setUser(null);
          }
        } else {
          console.error("Fehler beim Auth Check:", error);
          setUser(null);
        }
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
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Anmeldung fehlgeschlagen";
        console.error("Login fehlgeschlagen:", message, error.response?.status);
        throw new Error(message);
      } else {
        console.error("Login fehlgeschlagen:", error);
        throw new Error("Ein unbekannter Fehler ist aufgetreten");
      }
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
  const register = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.register({ email, password });
      setUser(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Registrierung fehlgeschlagen";
        console.error(
          "Registrierung fehlgeschlagen:",
          message,
          error.response?.status,
        );
        throw new Error(message);
      } else {
        console.error("Registrierung fehlgeschlagen:", error);
        throw new Error("Ein unbekannter Fehler ist aufgetreten");
      }
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
      showNotification("Logout fehlgeschlagen", "error");
      console.error("Logout fehlgeschlagen:", error);
      
      // Hinweis: Wenn das Cookie/die Session auf dem Server aktiv bleibt,
      // behalten wir zur Sicherheit den User-State lokal bei.
      throw new Error("Logout fehlgeschlagen. Session auf dem Server noch aktiv.");
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