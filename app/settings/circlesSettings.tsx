import SettingsContainer from "@/components/settings/SettingsContainer";
import SettingsItem from "@/components/settings/SettingsItem";
import { Colors } from "@/styles/colors";
import { ScrollView, useColorScheme } from "react-native";

export default function circlesSettings() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
    >
      <SettingsContainer title="Default Settings">
        <SettingsItem title="Circle Chat" type="switch" />
      </SettingsContainer>
    </ScrollView>
  );
}
