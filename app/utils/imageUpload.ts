import { Image } from "react-native";

type OptimizeImageOptions = {
	uri: string;
	maxWidth?: number;
	quality?: number;
};

async function getImageDimensions(uri: string) {
	return new Promise<{ width: number; height: number }>((resolve) => {
		Image.getSize(
			uri,
			(width, height) => resolve({ width, height }),
			() => resolve({ width: 1, height: 1 }),
		);
	});
}

export async function optimizeImage({ uri }: OptimizeImageOptions) {
	const dimensions = await getImageDimensions(uri);

	return {
		uri,
		width: dimensions.width,
		height: dimensions.height,
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
