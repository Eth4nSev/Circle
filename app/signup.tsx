import AppleButton from "@/components/accountManagement/appleButton";
import GoogleButton from "@/components/accountManagement/googleButton";
import SignUpInput from "@/components/accountManagement/signUpInput";
import Separator from "@/components/separator";
import { Colors } from "@/styles/colors";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	ImageBackground,
	Keyboard,
	Pressable,
	StyleSheet,
	Text,
	TouchableWithoutFeedback,
	useColorScheme,
	View,
} from "react-native";
import { supabase } from "./utils/supabase";

export default function SignUp() {
	const theme = useColorScheme() ?? "light";

	const textColor = Colors[theme].text;
	const backgroundImage =
		theme === "dark"
			? require("@/assets/images/loginbackground-dark.png")
			: require("@/assets/images/loginbackground-light.png");

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const handleSignup = async () => {
		if (!email || !password || !confirmPassword) {
			Alert.alert("Missing information", "Please fill in all fields.");
			return;
		}

		if (password !== confirmPassword) {
			Alert.alert(
				"Passwords don't match",
				"Please make sure your passwords match.",
			);
			return;
		}

		const { error } = await supabase.auth.signUp({
			email,
			password,
		});

		if (error) {
			Alert.alert("Signup failed", error.message);
			return;
		}

		router.push("./profileSetup");
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<ImageBackground
				source={backgroundImage}
				resizeMode="cover"
				style={styles.background}
			>
				<View style={[styles.overlay]}>
					<View style={styles.container}>
						<Text style={[styles.title, { color: textColor }]}>
							Create your account
						</Text>

						<Text style={[styles.subtitle, { color: textColor }]}>
							Join Circle and start connecting
						</Text>

						{/*<AppleButton />
						<GoogleButton />

						<View style={styles.separatorContainer}>
							<Separator />

							<Text style={[styles.orText, { color: textColor }]}>
								or
							</Text>

							<Separator />
						</View>*/}

						<SignUpInput
							email={email}
							password={password}
							confirmPassword={confirmPassword}
							setEmail={setEmail}
							setPassword={setPassword}
							setConfirmPassword={setConfirmPassword}
						/>

						<Pressable
							style={styles.signupButtonContainer}
							onPress={async () => {
								await Haptics.selectionAsync();
								await handleSignup();
							}}
						>
							<GlassView
								tintColor={Colors.accent}
								style={styles.signupButton}
								isInteractive
							>
								<Text style={styles.signupButtonText}>
									Create Account
								</Text>
							</GlassView>
						</Pressable>

						<Text style={[styles.terms, { color: textColor }]}>
							By creating an account, you agree to Circle's Terms
							of Service and Privacy Policy.
						</Text>

						<View style={styles.loginContainer}>
							<Text
								style={[styles.loginText, { color: textColor }]}
							>
								Already have an account?
							</Text>

							<Pressable
								onPress={async () => {
									await Haptics.selectionAsync();
									router.back();
								}}
							>
								<Text
									style={[
										styles.loginLink,
										{ color: Colors.accent },
									]}
								>
									{" "}
									Log In
								</Text>
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
		alignItems: "center",
		paddingHorizontal: 24,
		paddingTop: 50,
		justifyContent: "center",
	},

	container: {
		width: "100%",
		maxWidth: 420,
		alignItems: "center",
		marginBottom: 50,
	},

	title: {
		fontSize: 32,
		fontWeight: "700",
		textAlign: "center",
		marginBottom: 8,
	},

	subtitle: {
		fontSize: 16,
		opacity: 0.65,
		textAlign: "center",
		marginBottom: 32,
	},

	appleButtonContainer: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	appleButton: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	innerAppleButton: {
		flexDirection: "row",
		gap: 9,
	},
	appleText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "600",
	},
	googleButtonContainer: {
		marginTop: 10,
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	googleButton: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	innerGoogleButton: {
		flexDirection: "row",
		gap: 9,
	},
	googleText: {
		fontSize: 17,
		fontWeight: "600",
	},

	separatorContainer: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		marginVertical: 24,
		justifyContent: "center",
	},

	orText: {
		fontSize: 14,
		opacity: 0.5,
	},
	signupButtonContainer: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 20,
	},

	signupButton: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},

	signupButtonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
	},

	terms: {
		fontSize: 12,
		opacity: 0.55,
		textAlign: "center",
		lineHeight: 18,
		marginTop: 18,
		paddingHorizontal: 15,
	},

	loginContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 26,
	},

	loginText: {
		fontSize: 14,
		opacity: 0.7,
	},

	loginLink: {
		fontSize: 14,
		fontWeight: "700",
	},
});
