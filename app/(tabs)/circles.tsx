import PostContainer from "@/components/post";
import { ImageBackground, ScrollView, useColorScheme } from "react-native";

export default function Index() {
  const theme = useColorScheme() ?? "light";

  return (
    <ImageBackground
      source={require("@/assets/images/wallpaper.jpg")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <PostContainer
          href={require("@/assets/images/kitty.jpg")}
          time="Now"
          author="Admin"
          pfp={require("@/assets/images/admin.png")}
          caption="Kitty"
        />
        <PostContainer
          href={require("@/assets/images/circle.png")}
          time="5 minutes ago"
          author="Eth4nSev"
          pfp={require("@/assets/images/pfp.png")}
          caption="We are here"
        />
      </ScrollView>
    </ImageBackground>
  );
}
