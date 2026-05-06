import axios from "axios";
import { createContext, ReactNode, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import { User, UserWithoutPassword } from "../types/user";

/**
 * Verfügbare Farbschemata für die Anwendung.
 */
type Theme = "dark" | "light";

/**
 * Definition des AuthContext-Inhalts.
 * Bietet Zugriff auf den Benutzerstatus, Theme-Einstellungen und
 * Authentifizierungsmethoden wie Login, Register und Logout.
 */
export interface AuthContextType {
  user: User | null;
  theme: Theme;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleTheme: () => void;
  updateUser: (user: UserWithoutPassword) => void;
}

// Initialisierung des Contexts
export const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider
 *
 * Der zentrale State-Provider für die Authentifizierung. Er umschließt die gesamte App
 * und stellt sicher, dass der User-Status sowie das Theme über alle Komponenten hinweg
 * synchron bleiben.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Initialer Authentifizierungs-Check beim Start der App.
   * Prüft beim ersten Laden (Mount), ob bereits eine gültige Session (z.B. via Cookie)
   * beim Server existiert.
   */
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await apiService.getStatus();
        setUser(response.data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Ein 401 Fehler bedeutet lediglich, dass keine aktive Session vorliegt.
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
   * Bei Erfolg wird das User-Objekt im State gespeichert.
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.login({ email, password });

      setUser(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || "Anmeldung fehlgeschlagen";
        console.error("Login fehlgeschlagen:", message, error.response?.status);
        throw new Error(message);
      } else {
        console.error("Login Fehler:", error);
        throw new Error("Ein unbekannter Fehler ist aufgetreten");
      }
    }
  };

  /**
   * Registriert einen neuen Benutzer und loggt diesen bei Erfolg sofort ein.
   */
  const register = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiService.register({ email, password });

      setUser(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          error.response?.data?.message || "Registrierung fehlgeschlagen";
        console.error(
          "Registrierung fehlgeschlagen:",
          message,
          error.response?.status,
        );
        throw new Error(message);
      } else {
        console.error("Registrierung Fehler:", error);
        throw new Error("Ein unbekannter Fehler ist aufgetreten");
      }
    }
  };

  /**
   * Beendet die Session auf dem Server und löscht den lokalen User-State.
   */
  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();

      setUser(null);
    } catch (error) {
      console.error("Logout fehlgeschlagen:", error);
      // Auch bei Fehlern (z.B. Netzwerk weg) löschen wir den lokalen Status zur Sicherheit.
      setUser(null);
      throw new Error(
        "Logout fehlgeschlagen, aber Session wurde lokal gelöscht",
      );
    }
  };

  /**
   * Wechselt zwischen Dark- und Light-Mode.
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  /**
   * Erlaubt die Aktualisierung von Profildaten (z.B. Benutzername oder Gewicht),
   * ohne das Passwort im State zu verarbeiten.
   */
  const updateUser = (updatedUser: UserWithoutPassword) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        ...updatedUser,
      };
    });
  };

  // Zusammengefasstes Value-Objekt für den Context-Provider
  const value: AuthContextType = {
    user,
    theme,
    loading,
    login,
    register,
    logout,
    toggleTheme,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
