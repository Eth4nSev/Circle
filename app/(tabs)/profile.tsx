import { Colors } from "@/styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { Pressable, useColorScheme, View } from "react-native";

export default function Index() {
  const theme = useColorScheme() ?? "light";

  return (
    <View
      style={{
        flex: 1,
        /* justifyContent: "center",
        alignItems: "center", */
        backgroundColor: Colors[theme].background,
      }}
    >
      <Pressable onPress={() => router.push('/(tabs)/settings')}>
        <GlassView isInteractive style={{
          width: 50,
          height: 50,
          position: 'absolute',
          right: 10,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 50,
          top: 60,
        }}>
          <MaterialIcons name="settings" size={24} color={Colors[theme].text} />
        </GlassView>
      </Pressable>
    </View>
  );
}
