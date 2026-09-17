import { createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { Layout } from "@/routes/-layout";

export const Route = createRootRoute({ component: RootComponent });

function RootComponent() {
  return (
    <>
      <Layout />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
