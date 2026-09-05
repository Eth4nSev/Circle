import { Colors } from "@/styles/colors";
import { StyleSheet, useColorScheme, View } from "react-native";

export default function Separator() {
  const theme = useColorScheme() ?? "light";

  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors[theme as "light" | "dark"].separator,
        marginHorizontal: 16,
      }}
    />
  );
}
