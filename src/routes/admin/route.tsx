import { createFileRoute, redirect } from "@tanstack/react-router";

import type { ModeratorSession } from "@/types/events";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const response = await fetch("/api/admin/session", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });

    console.log("response", response);
    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");

    if (!response.ok || !isJson) {
      throw redirect({ to: "/" });
    }

    const session = (await response.json()) as ModeratorSession;

    if (!session.moderator?.email) {
      throw redirect({ to: "/" });
    }

    return session;
  },
});
