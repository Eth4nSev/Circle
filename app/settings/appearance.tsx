import SettingsContainer from "@/components/settings/SettingsContainer";
import SettingsItem from "@/components/settings/SettingsItem";
import SettingsLink from "@/components/settings/SettingsLink";
import { Colors } from "@/styles/colors";
import { Alert, ScrollView, useColorScheme } from "react-native";
import { useAccent } from "../context/accent";

export default function AppearanceSettings() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const { setAccent } = useAccent();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
    >
      <SettingsContainer subtitle="Change the accent color app-wide.">
        <SettingsItem title="Accent Color" type="color" />
        <SettingsLink
          type="external"
          title="Reset Color"
          onPress={() =>
            Alert.alert(
              "Reset Accent Color",
              "Are you sure you want to reset the accent color?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Continue",
                  onPress: () => {
                    setAccent(Colors.accent);
                  },
                },
              ],
            )
          }
        />
      </SettingsContainer>
    </ScrollView>
  );
}
