import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";

import { getModeratorSession } from "@/lib/auth";

type AuthContextValue = {
  moderator: { email: string } | null;
  isLoading: boolean;
  isModerator: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionQuery = useQuery({
    queryKey: ["moderator-session"],
    queryFn: getModeratorSession,
    retry: false,
    staleTime: 5 * 60 * 1_000,
  });
  const moderator = sessionQuery.data?.moderator ?? null;

  return (
    <AuthContext.Provider
      value={{
        moderator,
        isLoading: sessionQuery.isPending,
        isModerator: moderator !== null,
        refresh: async () => {
          await sessionQuery.refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
