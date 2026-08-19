import { Colors } from "@/styles/colors";
import { Text, useColorScheme, View } from "react-native";

export default function () {
  const theme = useColorScheme() ?? "light";

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 300,
      }}
    >
      <Text style={{ color: Colors[theme].text }}>Edit Screen</Text>
    </View>
  );
}
