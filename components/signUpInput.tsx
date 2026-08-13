import { Colors } from "@/styles/colors";
import { StyleSheet, TextInput, useColorScheme, View } from "react-native";
import Separator from "./separator";

export default function SignUpInput() {
	const theme = useColorScheme() ?? "light";

	const placeholderColor =
		theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";

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
				style={[
					styles.input,
					{
						color: Colors[theme].text,
						backgroundColor: Colors[theme].card,
					},
				]}
				placeholder="Email"
				placeholderTextColor={placeholderColor}
				keyboardType="email-address"
				autoComplete="email"
				textContentType="emailAddress"
				autoCapitalize="none"
				autoCorrect={false}
			/>

			<Separator />

			<TextInput
				style={[
					styles.input,
					{
						color: Colors[theme].text,
						backgroundColor: Colors[theme].card,
					},
				]}
				placeholder="Password"
				placeholderTextColor={placeholderColor}
				autoComplete="new-password"
				textContentType="newPassword"
				secureTextEntry
				autoCapitalize="none"
				autoCorrect={false}
			/>

			<Separator />

			<TextInput
				style={[
					styles.input,
					{
						color: Colors[theme].text,
						backgroundColor: Colors[theme].card,
					},
				]}
				placeholder="Confirm password"
				placeholderTextColor={placeholderColor}
				autoComplete="new-password"
				textContentType="newPassword"
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
});
