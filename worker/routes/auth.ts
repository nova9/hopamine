import type { Hono } from "hono";
import { createRemoteJWKSet, jwtVerify } from "jose";

import type { AccessJwks, AppEnvironment } from "../types";

let accessJwks: AccessJwks | undefined;

async function getModeratorEmail(
  executionCtx: unknown,
  request: Request,
  env: AppEnvironment["Bindings"],
) {
  const localIdentity = await (
    executionCtx as ExecutionContext
  ).access?.getIdentity();
  if (localIdentity?.email) return localIdentity.email;

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token || !env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;

  const teamOrigin = `https://${env.ACCESS_TEAM_DOMAIN}`;
  accessJwks ??= createRemoteJWKSet(
    new URL(`${teamOrigin}/cdn-cgi/access/certs`),
  );

  try {
    const { payload } = await jwtVerify(token, accessJwks, {
      issuer: teamOrigin,
      audience: env.ACCESS_AUD,
    });

    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export function registerAuthRoutes(app: Hono<AppEnvironment>) {
  app.use("/api/admin/*", async (c, next) => {
    const moderatorEmail = await getModeratorEmail(
      c.executionCtx,
      c.req.raw,
      c.env,
    );

    if (!moderatorEmail) {
      return c.json(
        {
          error:
            "Moderator access is required. Protect /admin/* and /api/admin/* with Cloudflare Access.",
        },
        401,
      );
    }

    c.set("moderatorEmail", moderatorEmail);
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
