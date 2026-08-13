import { Colors } from "@/styles/colors";
import { StyleSheet, TextInput, useColorScheme, View } from "react-native";
import Separator from "./separator";

export default function LoginInput() {
	const theme = useColorScheme() ?? "light";

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: Colors[theme].login,
					borderColor:
						theme === "dark"
							? "rgba(255,255,255,0.15)"
							: "rgba(0,0,0,0.12)",
				},
			]}
		>
			<TextInput
				style={[styles.input, { color: Colors[theme].text }]}
				placeholder="Email"
				placeholderTextColor={
					theme === "dark"
						? "rgba(255,255,255,0.45)"
						: "rgba(0,0,0,0.4)"
				}
				keyboardType="email-address"
				autoComplete="email"
				autoCapitalize="none"
				autoCorrect={false}
				textContentType="emailAddress"
			/>

			<View style={styles.separator}>
				<Separator />
			</View>

			<TextInput
				style={[styles.input, { color: Colors[theme].text }]}
				placeholder="Password"
				placeholderTextColor={
					theme === "dark"
						? "rgba(255,255,255,0.45)"
						: "rgba(0,0,0,0.4)"
				}
				autoComplete="password"
				textContentType="password"
				secureTextEntry
				autoCapitalize="none"
				autoCorrect={false}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		maxWidth: 420,
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},

	input: {
		height: 54,
		paddingHorizontal: 20,
		fontSize: 16,
	},

	separator: {
		marginHorizontal: 16,
	},
});
