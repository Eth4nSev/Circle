import { ImageBackground, useColorScheme } from "react-native";

export default function Index() {
  const theme = useColorScheme() ?? "light";

  return (
    <ImageBackground
      source={require("@/assets/images/wallpaper.jpg")}
      resizeMode="cover"
      style={{ flex: 1 }}
    ></ImageBackground>
  );
}
