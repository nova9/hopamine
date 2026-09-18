import { Hono } from "hono";

import { registerAdminRoutes } from "./routes/admin";
import { registerAuthRoutes } from "./routes/auth";
import { registerEventRoutes } from "./routes/events";
import { registerSubmissionRoutes } from "./routes/submissions";
import type { AppEnvironment } from "./types";

const app = new Hono<AppEnvironment>();

registerAuthRoutes(app);
registerAdminRoutes(app);
registerEventRoutes(app);
registerSubmissionRoutes(app);

app.get("/api/health", (c) => {
  return c.json({
    ok: true,
    message: "Hopamine API is running",
  });
});

export default app;
