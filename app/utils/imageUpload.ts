import * as ImageManipulator from "expo-image-manipulator";
import { SaveFormat } from "expo-image-manipulator";

type OptimizeImageOptions = {
  uri: string;
  maxWidth?: number;
  quality?: number;
};

export async function optimizeImage({
  uri,
  maxWidth = 1080,
  quality = 0.78,
}: OptimizeImageOptions) {
  const context = ImageManipulator.manipulate(uri);
  const image = context.resize({ width: maxWidth, height: null });
  const rendered = await image.renderAsync();

  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: quality,
  });

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    contentType: "image/jpeg",
    extension: "jpg",
  };
}

export async function fileUriToArrayBuffer(uri: string) {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error("Failed to read image file.");
  }

  return response.arrayBuffer();
}

export function getStoragePathFromPublicUrl(
  url: string | null,
  bucket: string,
) {
  if (!url) return null;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return decodeURIComponent(url.slice(index + marker.length));
}
