import { Colors } from "@/styles/colors";
import { Text, useColorScheme, View } from "react-native";

export default function emojiReact() {
  const theme = useColorScheme() ?? "light";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: Colors[theme as "light" | "dark"].text,
          marginVertical: 30,
          fontWeight: "bold",
        }}
      >
        Select an Emoji
      </Text>
    </View>
  );
}
