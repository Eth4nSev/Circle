import { Colors } from "@/styles/colors";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Switch, Text, useColorScheme, View } from "react-native";

type types = "switch" | "text" | "option";

type SettingItemProps = {
  title: string;
  selected?: boolean;
  subtitle?: string;
  type?: types;
};

export default function SettingsItem({
  title,
  selected,
  subtitle,
  type,
}: SettingItemProps) {
  const theme = useColorScheme() ?? 'light';

  return (
    <View style={styles.settingsItem}>
      <Text style={[styles.settingsText, { color: Colors[theme].text }]}>{title}</Text>
      {selected && <MaterialIcons name="check" size={20} color={"#0188fe"} />}
      {subtitle && (
        <Text style={{ fontSize: 17, color: "#888" }}>{subtitle}</Text>
      )}
      {type === "switch" && <Switch style={{ margin: 0, padding: 0 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  settingsItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsText: {
    fontSize: 17,
  },
})
