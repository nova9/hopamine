import type { Hono } from "hono";

export type AppEnvironment = {
  Bindings: Env;
  Variables: { moderatorEmail: string };
};

async function getAccessIdentity(executionCtx: unknown) {
  return (executionCtx as ExecutionContext).access?.getIdentity();
}

export function registerAuthRoutes(app: Hono<AppEnvironment>) {
  app.use("/api/admin/*", async (c, next) => {
    const identity = await getAccessIdentity(c.executionCtx);

    if (!identity?.email) {
      return c.json(
        {
          error:
            "Moderator access is required. Protect /admin/* and /api/admin/* with Cloudflare Access.",
        },
        401,
      );
    }

    c.set("moderatorEmail", identity.email);
    await next();
  });

  app.get("/api/admin/session", (c) => {
    return c.json({
      moderator: {
        email: c.get("moderatorEmail"),
      },
    });
  });
}
