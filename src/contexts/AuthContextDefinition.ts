import { createContext } from "react";

// Type definitions
type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
};

export type AuthContextType = { // Export the type
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (name: string, email: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
};

// Create and export the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
 