import SettingsContainer from "@/components/settings/SettingsContainer";
import SettingsItem from "@/components/settings/SettingsItem";
import SettingsLink from "@/components/settings/SettingsLink";
import { Colors } from "@/styles/colors";
import { ScrollView, useColorScheme } from "react-native";
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
			<SettingsContainer>
				<SettingsItem title="Accent Color" type="color" />
				<SettingsLink
					type="external"
					title="Reset Color"
					onPress={() => setAccent(Colors.accent)}
				/>
			</SettingsContainer>
		</ScrollView>
	);
}
