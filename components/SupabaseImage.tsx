import { Image, type ImageProps } from "expo-image";

type Props = Omit<ImageProps, "source"> & {
  uri?: string | null;
  source?: ImageProps["source"];
};

export default function SupabaseImage({ uri, source, ...props }: Props) {
  const imageSource = source ?? (uri ? uri : null);

  if (!imageSource) return null;

  return (
    <Image
      source={imageSource}
      cachePolicy="disk"
      {...props}
    />
  );
}
