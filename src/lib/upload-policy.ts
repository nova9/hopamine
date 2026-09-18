export const DOCUMENT_EXTENSIONS = [
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".pdf",
] as const;

export const DOCUMENT_MIME_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/pdf",
] as const;

export const DOCUMENT_ACCEPT = [
  ...DOCUMENT_EXTENSIONS,
  ...DOCUMENT_MIME_TYPES,
].join(",");

export const DOCUMENT_TYPE_LABEL = "DOC, DOCX, PPT, PPTX, or PDF";

export function hasAllowedDocumentExtension(filename: string) {
  const lowercaseName = filename.toLowerCase();
  return DOCUMENT_EXTENSIONS.some((extension) =>
    lowercaseName.endsWith(extension),
  );
}

export function hasAllowedDocumentMimeType(mimeType: string) {
  return (
    !mimeType ||
    DOCUMENT_MIME_TYPES.includes(
      mimeType as (typeof DOCUMENT_MIME_TYPES)[number],
    )
  );
}
