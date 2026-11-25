import { createContext, useContext, useEffect, useState } from "react";
import api from "@/api/api";
import type { User } from "@/types";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      if (localStorage.getItem("token")) {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data.data.user);
        } catch (error) {
          console.log(error);
        }
      }
      setLoading(false);
    };

    getUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.data.token);
    setUser(res.data.data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", res.data.data.token);
    setUser(res.data.data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
