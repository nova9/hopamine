import encode from "@jsquash/avif/encode";

const AVIF_TYPE = "image/avif";
const MAX_IMAGE_BYTES = 200 * 1024 - 1;
const AVIF_QUALITIES = [65, 50, 35, 20];
const RESIZE_FACTOR = 0.8;

function getAvifName(filename: string) {
  const extensionIndex = filename.lastIndexOf(".");
  const basename = extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename;

  return `${basename}.avif`;
}

export function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export async function convertImageToAvif(file: File) {
  if (!isImageFile(file)) return file;

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });
    let width = bitmap.width;
    let height = bitmap.height;

    try {
      while (width > 1 || height > 1) {
        const canvas = new OffscreenCanvas(width, height);
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Image conversion is not supported in this browser.");
        }

        context.drawImage(bitmap, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);

        for (const quality of AVIF_QUALITIES) {
          const encoded = await encode(imageData, { quality, speed: 8 });

          if (encoded.byteLength <= MAX_IMAGE_BYTES) {
            return new File([encoded], getAvifName(file.name), {
              type: AVIF_TYPE,
              lastModified: file.lastModified,
            });
          }
        }

        width = Math.max(1, Math.floor(width * RESIZE_FACTOR));
        height = Math.max(1, Math.floor(height * RESIZE_FACTOR));
      }
    } finally {
      bitmap.close();
    }

    throw new Error(`${file.name} could not be reduced below 200 KB.`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not supported")) {
      throw error;
    }

    throw new Error(`${file.name} could not be converted to AVIF.`);
  }
}

export async function convertFormDataImages(formData: FormData, fieldName: string) {
  const values = formData.getAll(fieldName);
  const convertedValues = await Promise.all(
    values.map((value) =>
      value instanceof File ? convertImageToAvif(value) : value,
    ),
  );

  formData.delete(fieldName);
  for (const value of convertedValues) {
    formData.append(fieldName, value);
  }
}
