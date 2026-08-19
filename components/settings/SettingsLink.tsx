import { Colors } from "@/styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type external = "internal" | "external";

type SettingsLinkProps = {
  title: string;
  href: string;
  type?: external;
  selectedValue?: string;
  danger?: boolean;
};

export default function SettingsLink({
  title,
  href,
  type = "internal",
  selectedValue,
  danger,
}: SettingsLinkProps) {
  const theme = useColorScheme() ?? "light";

  return (
    <Pressable
      onPress={() => router.push(href as any)}
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && styles.settingsItemPressed,
      ]}
    >
      {type === "external" ? (
        <Text style={{ fontSize: 17, color: "#0188fe" }}>{title}</Text>
      ) : (
        <>
          <Text style={[styles.settingsText, { color: Colors[theme].text }]}>
            {title}
          </Text>
          <View style={styles.settingsValueContainer}>
            {selectedValue && (
              <Text style={styles.selectedInsideText}>{selectedValue}</Text>
            )}
            <MaterialIcons name="arrow-forward-ios" size={17} color="#555" />
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settingsItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsItemPressed: {
    opacity: 0.7,
    backgroundColor: "#555",
    borderRadius: 20,
  },
  settingsText: {
    fontSize: 17,
  },
  settingsValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectedInsideText: {
    color: "#888",
    fontSize: 17,
  },
});
