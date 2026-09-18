import { LockKey } from "@phosphor-icons/react";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/admin")({
  component: AdminRoute,
});

function AdminRoute() {
  const { isLoading, isModerator } = useAuth();

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Verifying moderator access…</p>
      </main>
    );
  }

  if (!isModerator) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <Alert>
          <LockKey aria-hidden="true" />
          <AlertTitle>Moderator access required</AlertTitle>
          <AlertDescription>
            Sign-in is provided by Cloudflare Access. In local guest mode, the
            hosted sign-in screen is not available.
          </AlertDescription>
        </Alert>
        <Link to="/" className={`${buttonVariants({ variant: "outline" })} mt-4`}>
          Return to public events
        </Link>
      </main>
    );
  }

  return <Outlet />;
}
