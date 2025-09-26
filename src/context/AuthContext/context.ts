import { createContext } from "react";
import { User } from "firebase/auth";

export const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
} | null>(null);


