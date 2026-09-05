import { Colors } from "@/styles/colors";
import { ScrollView, Text, useColorScheme } from "react-native";

export default function Index() {
  const theme = useColorScheme() ?? "light";

  return (
    <ScrollView
      style={{
        backgroundColor: Colors[theme as "light" | "dark"].background,
        flex: 1,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text style={{ color: Colors[theme as "light" | "dark"].text }}>
        Circles Page
      </Text>
    </ScrollView>
  );
}
