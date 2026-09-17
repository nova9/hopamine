export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({
        ok: true,
        message: "Hopamine API is running",
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
