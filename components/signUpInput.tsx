import { Colors } from "@/styles/colors";
import { StyleSheet, TextInput, useColorScheme, View } from "react-native";
import Separator from "./separator";

type SignUpInputProps = {
	email: string;
	password: string;
	confirmPassword: string;
	setEmail: (value: string) => void;
	setPassword: (value: string) => void;
	setConfirmPassword: (value: string) => void;
};

export default function SignUpInput({
	email,
	password,
	confirmPassword,
	setEmail,
	setPassword,
	setConfirmPassword,
}: SignUpInputProps) {
	const theme = useColorScheme() ?? "light";

	const placeholderColor =
		theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)";

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: Colors[theme].login,
					borderColor: theme === "dark" ? "#fff" : "#000",
				},
			]}
		>
			<TextInput
				style={[styles.input, { color: Colors[theme].text }]}
				placeholder="Email"
				placeholderTextColor={placeholderColor}
				value={email}
				onChangeText={setEmail}
				keyboardType="email-address"
				autoComplete="email"
				textContentType="emailAddress"
				autoCapitalize="none"
				autoCorrect={false}
			/>

			<Separator />

			<TextInput
				style={[styles.input, { color: Colors[theme].text }]}
				placeholder="Password"
				placeholderTextColor={placeholderColor}
				value={password}
				onChangeText={setPassword}
				autoComplete="new-password"
				textContentType="newPassword"
				secureTextEntry
				autoCapitalize="none"
				autoCorrect={false}
			/>

			<Separator />

			<TextInput
				style={[styles.input, { color: Colors[theme].text }]}
				placeholder="Confirm password"
				placeholderTextColor={placeholderColor}
				value={confirmPassword}
				onChangeText={setConfirmPassword}
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
