import LoginInput from "@/components/loginInput";
import Separator from "@/components/separator";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
	ImageBackground,
	Keyboard,
	Pressable,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	useColorScheme,
	View,
} from "react-native";

export default function LogIn() {
	const theme = useColorScheme() ?? "light";

	const backgroundImage =
		theme === "dark"
			? require("@/assets/images/loginbackground-dark.png")
			: require("@/assets/images/loginbackground-light.png");

	const textColor = Colors[theme].text;

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<ImageBackground
				source={backgroundImage}
				resizeMode="cover"
				style={styles.background}
			>
				<View style={styles.overlay}>
					<View style={styles.container}>
						<Text style={[styles.title, { color: textColor }]}>
							Welcome back
						</Text>

						<Text style={[styles.subtitle, { color: textColor }]}>
							Log in to continue to Circle
						</Text>

						<View
							style={[
								styles.appleButton,
								{ borderColor: Colors[theme].text },
							]}
						>
							<Ionicons
								name="logo-apple"
								size={21}
								color="#fff"
							/>

							<Text style={styles.appleText}>
								Continue with Apple
							</Text>
						</View>

						<View style={styles.separatorContainer}>
							<Separator />
							<Text style={[styles.orText, { color: textColor }]}>
								or
							</Text>
							<Separator />
						</View>

						<View style={styles.form}>
							<LoginInput />
						</View>

						<Pressable style={styles.loginButton}>
							<Text style={styles.loginText}>Log In</Text>
						</Pressable>

						<Pressable style={styles.forgotButton}>
							<Text style={styles.forgotText}>
								Forgot password?
							</Text>
						</Pressable>

						<View style={styles.signupContainer}>
							<Text
								style={[
									styles.signupText,
									{ color: textColor },
								]}
							>
								Don't have an account?
							</Text>

							<Pressable onPress={() => router.push("/signup")}>
								<Text style={styles.signupLink}> Sign Up</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</ImageBackground>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	background: {
		flex: 1,
	},

	overlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
	},

	container: {
		width: "100%",
		maxWidth: 420,
		alignItems: "center",
	},

	title: {
		fontSize: 34,
		fontWeight: "700",
		marginBottom: 8,
	},

	subtitle: {
		fontSize: 16,
		opacity: 0.65,
		marginBottom: 36,
	},

	appleButton: {
		width: "100%",
		height: 52,
		borderRadius: 12,
		backgroundColor: "#000",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 9,
		borderWidth: StyleSheet.hairlineWidth,
	},

	appleText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "600",
	},

	separatorContainer: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginVertical: 26,
		justifyContent: "center",
	},

	orText: {
		fontSize: 14,
		opacity: 0.5,
	},

	form: {
		width: "100%",
	},

	loginButton: {
		width: "100%",
		height: 52,
		borderRadius: 12,
		backgroundColor: "#17b3da",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 20,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.6)",
	},

	loginText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
	},

	forgotButton: {
		marginTop: 18,
	},

	forgotText: {
		color: "#17b3da",
		fontSize: 14,
		fontWeight: "600",
	},

	signupContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 32,
	},

	signupText: {
		fontSize: 14,
		opacity: 0.7,
	},

	signupLink: {
		color: "#17b3da",
		fontSize: 14,
		fontWeight: "700",
	},
});
