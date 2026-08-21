import { Colors } from "@/styles/colors";
import { Entypo } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { Pressable, StyleSheet, useColorScheme } from "react-native";

export default function Back() {
  const theme = useColorScheme() ?? "light";

  return (
    <Pressable style={styles.editButton} onPress={() => router.back()}>
      <GlassView isInteractive style={styles.glassButton}>
        <Entypo
          name="chevron-small-left"
          color={Colors[theme].text}
          size={45}
        />
      </GlassView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  editButton: {
    position: "absolute",
    left: 16,
    zIndex: 16,
    top: 60,
  },
  glassButton: {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});
