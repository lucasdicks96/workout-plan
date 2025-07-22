import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
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

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiService
      .getStatus()
      .then((response) => {
        // console.log("AuthContext useEffect response:", response.data.user);
        if (response.data.user) {
          const { id, email } = response.data.user;
          console.log("AuthContext useEffect response 2:", id, email);
          setUser(response.data.user);
        }
      })
      .catch(() => {
        console.log("AuthContext useEffect error: User not authenticated");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    setUser(response.data.user);
    console.log("AuthContext login ", response.data);
  };
  const register = async (email: string, password: string) => {
    const response = await apiService.register(email, password);
    setUser(response.data.user);
  };
  const logout = async () => {
    await apiService.logout();
    setUser(null);
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
