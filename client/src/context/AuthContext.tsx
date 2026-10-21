// Manages user authenitication state for the entire
// "Context" in React is a way to store data globally without passing props down through every componet (prop drilling)

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "../types";
import api from "../Services/api";
import toast from "react-hot-toast";
import { clearClientSession, SESSION_CLEARED_EVENT } from "../utils/session";

//  Authcontext stores:
// 1. The current logged-in user (or null if not logged )
//2. Login/Logout/register
//3. Loading state while checking authentication

//---- Define what the context  will provide
// This interface describes all the values/functions AuthContext shares

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updateUser: Partial<User>) => void;
}

// Create the context with undefined as default value
// (the real value is provided by AuthProvider)

const AuthContext = createContext<AuthContextType | undefined>(undefined);

//----- AuthProvider Componet---
// wrap your app in this to make auth data available everywhere

interface AuthProviderProps {
  children: ReactNode; // Everything nested insifde <Authprovider>
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // User state - null means not logged in
  const [user, setUser] = useState<User | null>(null);

  // True while we check LocalStorage on app load
  const [loading, setLoading] = useState<boolean>(true);

  //--- Load user from localStorage on app start
  // localStorage persists data across browser sessions (survives page refresh)

  useEffect(() => {
    const userStr = localStorage.getItem("audiophile-user");

    if (userStr) {
      try {
        const savedUser: User = JSON.parse(userStr);
        setUser(savedUser);
      } catch (error) {
        //if JSON parse fails (corrupted data), clear it
        localStorage.removeItem("audiophile-user");
      }
    }
    const invalidate = () => setUser(null);
    window.addEventListener(SESSION_CLEARED_EVENT, invalidate);
    const onStorage = (event: StorageEvent) => {
      if (event.key === null) { invalidate(); return; }
      if (event.key !== "audiophile-user") return;
      if (!event.newValue) { invalidate(); return; }
      try {
        const nextUser = JSON.parse(event.newValue) as User;
        if (typeof nextUser._id === "string" && typeof nextUser.token === "string") setUser(nextUser);
        else invalidate();
      } catch { invalidate(); }
    };
    window.addEventListener("storage", onStorage);
    setLoading(false);
    return () => {
      window.removeEventListener(SESSION_CLEARED_EVENT, invalidate);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // -- LOGIN --
  // Returns true if login succeeded, false if it failed
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // POST /api/auth/login
      const { data } = await api.post<User>("/auth/login", { email, password });

      //
      setUser(data);
      localStorage.setItem("audiophile-user", JSON.stringify(data));

      toast.success(`Welcome back ${data.name}! 🎧`);
      return true;
    } catch (error: any) {
      // error.response?.data?.message is the message from our Express server
      const message = error.response?.data?.message || "Login failed";

      toast.error(message);
      return false;
    }
  };

  // --- REGISTER ---

  // Returns true if registration succeded, false if it failed
  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      const { data } = await api.post<User>("/auth/register", {
        name,
        email,
        password,
      });

      setUser(data);
      localStorage.setItem("audiophile-user", JSON.stringify(data));

      toast.success(`Welcome to Audiophile, ${data.name} 🎧`);
      return true;
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      return false;
    }
  };

  //--- LOGOUT ---
  const logout = (): void => {
    setUser(null);
    clearClientSession();
    toast.success("Logged out successfully");
  };

  // ----- UPDATE USER ----(local only)
  //Used after profile update - refreshes data in context without re-fetching

  const updateUser = (updateData: Partial<User>): void => {
    if (user) {
      const updated = { ...user, ...updateData };
      setUser(updated);
      localStorage.setItem("audiophile-user", JSON.stringify(updated));
    }
  };

  // ----- Provide the context values to all children ----
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/// ---- CUSTOM HOOK FOR AUTHCONTEXT ----
// This hook makes it easy to use AuthContext in any componet
/// Const {user, login, logout etc} = useAuth()
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  // Safety check - useAuth must be used inside AuthProvider
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
