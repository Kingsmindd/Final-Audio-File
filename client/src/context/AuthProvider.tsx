import { useEffect, useState, type ReactNode } from "react";
import type { User } from "../types";
import api, { getApiErrorMessage } from "../Services/api";
import toast from "react-hot-toast";
import { clearClientSession, SESSION_CLEARED_EVENT } from "../utils/session";
import AuthContext from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode; // Everything nested insifde <Authprovider>
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // User state - null means not logged in
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("audiophile-user");
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed && typeof parsed._id === "string" && typeof parsed.token === "string"
        ? parsed as User
        : null;
    } catch {
      return null;
    }
  });

  // Account restoration runs in the state initializer before the first render.
  const loading = false; // Saved account restoration is synchronous; the API still authorizes requests.

  //--- Keep account state synchronized across tabs
  // localStorage persists data across browser sessions (survives page refresh)

  useEffect(() => {
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
    } catch (error: unknown) {
      // error.response?.data?.message is the message from our Express server
      const message = getApiErrorMessage(error, "Login failed");

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
      await api.post("/auth/register", {
        name,
        email,
        password,
      });

      toast.success("Account created. Please sign in to continue.");
      return true;
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "Registration failed");
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
