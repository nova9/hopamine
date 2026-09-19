export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function sanitizeFilename(filename: string) {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
}

export function createDownloadResponse(
  object: R2ObjectBody,
  filename: string,
  contentType: string,
) {
  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename.replace(/["\\]/g, "-")}"`,
      "Content-Length": String(object.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000",
    },
  });
}

export function createPreviewResponse(
  object: R2ObjectBody,
  filename: string,
  contentType: string,
) {
  return new Response(object.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${filename.replace(/["\\]/g, "-")}"`,
      "Content-Length": String(object.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000",
      "Content-Security-Policy": "default-src 'none'; frame-ancestors 'self'",
    },
  });
}
