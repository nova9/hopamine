import { createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { SiteLayout } from '@/components/site'

const RootLayout = () => (
  <>
    <SiteLayout />
    <TanStackRouterDevtools position="bottom-right" />
  </>
)

export const Route = createRootRoute({ component: RootLayout })
