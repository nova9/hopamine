import { createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Layout } from "@/routes/-layout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const Route = createRootRoute({ component: RootComponent });

const queryClient = new QueryClient();

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout />
      <TanStackRouterDevtools position="bottom-right" />
    </QueryClientProvider>
  );
}
