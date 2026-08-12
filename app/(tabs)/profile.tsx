import { Colors } from "@/styles/colors";
import { Link } from "expo-router";
import { useColorScheme, View } from "react-native";

export default function Index() {
  const theme = useColorScheme() ?? "light";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.light.background,
      }}
    >
      <Link href="../modal">Open Sheet Modal</Link>
    </View>
  );
}
