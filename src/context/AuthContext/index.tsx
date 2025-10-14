import { useEffect, useMemo, useState } from "react";
import { AuthContext, AppUser } from "./context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    fetch("/api/users/getProfile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        setUser({
          id: data.user._id || data.user.id,
          username: data.user.username,
          email: data.user.email,
          fullName: data.user.fullName,
          role: data.user.role,
        });
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  const accessToken = localStorage.getItem("accessToken");
  const value = useMemo(() => ({ user, loading, setUser, logout, accessToken }), [user, loading, accessToken]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
