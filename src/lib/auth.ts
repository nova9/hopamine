import type { ModeratorSession } from "@/types/events";

export async function getModeratorSession(): Promise<ModeratorSession | null> {
  try {
    const response = await fetch("/api/admin/session", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");

    if (!response.ok || !isJson) return null;

    const session = (await response.json()) as ModeratorSession;
    return session.moderator?.email ? session : null;
  } catch {
    return null;
  }
}
