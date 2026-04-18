import { createContext, useContext, useMemo, useState } from "react";
import { login as loginRequest } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("routemind_user");
    return saved ? JSON.parse(saved) : null;
  });

  const value = useMemo(
    () => ({
      user,
      async login(email, password, role) {
        const result = await loginRequest(email, password, role);
        localStorage.setItem("routemind_token", result.access_token);
        localStorage.setItem("routemind_user", JSON.stringify(result.user));
        setUser(result.user);
        return result.user;
      },
      logout() {
        localStorage.removeItem("routemind_token");
        localStorage.removeItem("routemind_user");
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
