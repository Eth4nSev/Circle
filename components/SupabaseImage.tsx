import { Image, type ImageProps } from "expo-image";

type Props = Omit<ImageProps, "source"> & {
  uri: string | null | undefined;
};

export default function SupabaseImage({ uri, ...props }: Props) {
  if (!uri) return null;

  return (
    <Image
      source={uri}
      cachePolicy="disk"
      {...props}
    />
  );
}
