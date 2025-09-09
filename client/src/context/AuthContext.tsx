import { createContext, ReactNode, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import User from "../types/user";

type Theme = "dark" | "light";

export interface AuthContextType {
  user: User | null;
  theme: Theme;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleTheme: () => void;
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
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.data.user);
    } catch (error) {
      console.error("Login fehlgeschlagen", error);
      throw error;
    }
  };
  const register = async (email: string, password: string) => {
    try {
      const response = await apiService.register(email, password);
      console.log(response.data.user);
      setUser(response.data.user);
    } catch (error) {
      console.error("Registrierung fehlgeschlagen", error);
      throw error;
    }
  };
  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error("Logout fehlgeschlagen", error);
      setUser(null);
      throw error;
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const value: AuthContextType = {
    user,
    theme,
    loading,
    login,
    register,
    logout,
    toggleTheme,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
