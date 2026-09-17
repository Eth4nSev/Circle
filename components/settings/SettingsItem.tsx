import { useAccent } from "@/app/context/accent";
import { Colors } from "@/styles/colors";
import { ColorPicker, Host } from "@expo/ui/swift-ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Switch, Text, useColorScheme, View } from "react-native";

type types = "switch" | "text" | "option" | "color";

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
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];
	const { accent, setAccent } = useAccent();
	const [isEnabled, setIsEnabled] = useState(false);

	return (
		<View style={styles.settingsItem}>
			<Text style={[styles.settingsText, { color: colors.text }]}>
				{title}
			</Text>
			{selected && (
				<MaterialIcons name="check" size={20} color={"#0188fe"} />
			)}
			{subtitle && (
				<Text style={{ fontSize: 17, color: "#888" }}>{subtitle}</Text>
			)}
			{type === "switch" ? (
				<Switch
					value={isEnabled}
					onValueChange={setIsEnabled}
					trackColor={{
						true: accent,
					}}
					style={{ margin: 0, padding: 0 }}
				/>
			) : type === "color" ? (
				<Host matchContents>
					<ColorPicker
						selection={accent}
						onSelectionChange={(color) => {
							setAccent(color);
						}}
					/>
				</Host>
			) : null}
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
});
