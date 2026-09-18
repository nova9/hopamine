import encode from "@jsquash/avif/encode";

const AVIF_TYPE = "image/avif";

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
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      throw new Error("Image conversion is not supported in this browser.");
    }

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const encoded = await encode(imageData, { quality: 75, speed: 8 });

    return new File([encoded], getAvifName(file.name), {
      type: AVIF_TYPE,
      lastModified: file.lastModified,
    });
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
