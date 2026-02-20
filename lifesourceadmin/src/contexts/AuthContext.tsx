import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import axios, { AxiosError } from "axios";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  errorMessage: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const apiURL = import.meta.env.VITE_REACT_APP_BASE_URL as string;

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (token) {
      setIsAuthenticated(true);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    setErrorMessage(null);

    const url = `${apiURL}/auth/login`;

    try {
      const res = await axios.post<{
        message: string; data: {
          accessToken: string;
          user: {
            firstName: string;
            lastName: string;
            email: string
          }
        }
      }>(url, {
        email,
        password,
      });

      const { accessToken, user } = res.data.data;

      localStorage.setItem("adminToken", accessToken);

      localStorage.setItem("adminUser", JSON.stringify(user))

      axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

      setIsAuthenticated(true);
      return true;
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;

      const message =
        err.response?.data?.message || "Login failed";

      setErrorMessage(message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    delete axios.defaults.headers.common["Authorization"];
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        loading,
        errorMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
