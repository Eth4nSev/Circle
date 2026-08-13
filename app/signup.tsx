import Separator from "@/components/separator";
import SignUpInput from "@/components/signUpInput";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from "react-native";

export default function SignUp() {
	const theme = useColorScheme() ?? "light";

	const textColor = Colors[theme].text;
	const modalBackground = Colors[theme].loginModal;

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<View
				style={[styles.overlay, { backgroundColor: modalBackground }]}
			>
				<View style={styles.container}>
					<Text style={[styles.title, { color: textColor }]}>
						Create your account
					</Text>

					<Text style={[styles.subtitle, { color: textColor }]}>
						Join Circle and start connecting
					</Text>

					<Pressable
						style={[styles.appleButton, { borderColor: textColor }]}
					>
						<Ionicons name="logo-apple" size={21} color="#fff" />

						<Text style={styles.appleText}>
							Continue with Apple
						</Text>
					</Pressable>

					<View style={styles.separatorContainer}>
						<Separator />

						<Text style={[styles.orText, { color: textColor }]}>
							or
						</Text>

						<Separator />
					</View>

					<SignUpInput />

					<Pressable style={styles.signupButton}>
						<Text style={styles.signupButtonText}>
							Create Account
						</Text>
					</Pressable>

					<Text style={[styles.terms, { color: textColor }]}>
						By creating an account, you agree to Circle's Terms of
						Service and Privacy Policy.
					</Text>

					<View style={styles.loginContainer}>
						<Text style={[styles.loginText, { color: textColor }]}>
							Already have an account?
						</Text>

						<Pressable onPress={() => router.back()}>
							<Text style={styles.loginLink}> Log In</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		alignItems: "center",
		paddingHorizontal: 24,
		paddingTop: 50,
	},

	container: {
		width: "100%",
		maxWidth: 420,
		alignItems: "center",
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
		marginVertical: 24,
		justifyContent: "center",
	},

	orText: {
		fontSize: 14,
		opacity: 0.5,
	},

	signupButton: {
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
		color: "#17b3da",
		fontSize: 14,
		fontWeight: "700",
	},
});
