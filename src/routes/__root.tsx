import { createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { AuthProvider } from "@/contexts/auth-context";
import { Layout } from "@/routes/-layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRoute({ component: RootComponent });

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout />
        <Toaster richColors />
      </AuthProvider>
      <TanStackRouterDevtools position="bottom-right" />
    </QueryClientProvider>
  );
}
