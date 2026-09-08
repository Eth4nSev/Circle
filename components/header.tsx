import { Colors } from "@/styles/colors";
import { Text, useColorScheme, View } from "react-native";
import Back from "./Back";

type HeaderProps = {
  title: string;
};

export default function Header({ title }: HeaderProps) {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  return (
    <View
      style={{
        position: "absolute",
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Back />

      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: colors.text }}>{title}</Text>
      </View>
    </View>
  );
}
