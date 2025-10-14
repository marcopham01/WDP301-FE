import { createContext } from "react";

export interface AppUser {
  id: string;
  username?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

export const AuthContext = createContext<{
  user: AppUser | null;
  loading: boolean;
  setUser: (user: AppUser | null) => void;
  logout: () => void;
  accessToken?: string | null;
} | null>(null);


