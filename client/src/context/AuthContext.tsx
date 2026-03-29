import axios from "axios";
import { createContext, ReactNode, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import { User, UserWithoutPassword } from "../types/user";

type Theme = "dark" | "light";

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

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await apiService.getStatus();
        setUser(response.data.user);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            console.warn("Auth Check: User nicht authentifiziert");
            setUser(null);
          } else {
            console.error("Fehler beim Auth Check:", error.response?.data?.message || error.message);
            setUser(null);
          }
        } else {
          console.error("Fehler beim Auth Check:", error);
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Only call once on mount
    checkAuthStatus();
  }, []); // Empty dependencies - only runs on mount

  const login = async (email: string, password: string): Promise<void> => {
    console.log("Login attempt for:", email);
    try {
      const response = await apiService.login(email, password);
      console.log("Login successful, user:", response.user);
      setUser(response.user);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Anmeldung fehlgeschlagen";
        console.error("Login fehlgeschlagen:", message, error.response?.status);
        // Throw a more descriptive error
        throw new Error(message);
      } else {
        console.error("Login Fehler:", error);
        throw new Error("Ein unbekannter Fehler ist aufgetreten");
      }
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    console.log("Register attempt for:", email);
    try {
      const response = await apiService.register(email, password);
      console.log("Registrierung erfolgreich, user:", response.user);
      setUser(response.user);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Registrierung fehlgeschlagen";
        console.error("Registrierung fehlgeschlagen:", message, error.response?.status);
        throw new Error(message);
      } else {
        console.error("Registrierung Fehler:", error);
        throw new Error("Ein unbekannter Fehler ist aufgetreten");
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
      console.log("Logout erfolgreich");
    } catch (error) {
      console.error("Logout fehlgeschlagen:", error);
      // Even if logout fails, clear local state
      setUser(null);
      throw new Error("Logout fehlgeschlagen, aber Session wurde lokal gelöscht");
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const updateUser = (updatedUser: UserWithoutPassword) => {
    setUser((prevUser) => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        ...updatedUser,
      };
    });
  };

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
