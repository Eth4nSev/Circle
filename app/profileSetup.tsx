import Separator from "@/components/separator";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    ImageBackground,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableWithoutFeedback,
    useColorScheme,
    View,
} from "react-native";
import { supabase } from "./utils/supabase";

export default function ProfileSetup() {
	const theme = useColorScheme() ?? "light";
	const textColor = Colors[theme].text;

	const backgroundImage =
		theme === "dark"
			? require("@/assets/images/loginbackground-dark.png")
			: require("@/assets/images/loginbackground-light.png");

	const [displayName, setDisplayName] = useState("");
	const [username, setUsername] = useState("");
	const [profileImage, setProfileImage] = useState<string | null>(null);

	const pickImage = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});

		if (!result.canceled) {
			setProfileImage(result.assets[0].uri);
		}
	};

	const createProfile = async () => {
		if (!displayName.trim() || !username.trim()) {
			Alert.alert(
				"Missing information",
				"Please enter a display name and username.",
			);
			return;
		}

		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			Alert.alert("Error", "You are not currently signed in.");
			return;
		}

		const { error } = await supabase.from("profiles").insert({
			id: user.id,
			display_name: displayName.trim(),
			username: username.trim(),
		});

		if (error) {
			Alert.alert("Profile setup failed", error.message);
			return;
		}

		router.replace("/");
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<ImageBackground
				source={backgroundImage}
				resizeMode="cover"
				style={styles.background}
			>
				<View style={styles.container}>
					<View style={styles.content}>
						<Text style={[styles.title, { color: textColor }]}>
							Set up your profile
						</Text>

						<Text style={[styles.subtitle, { color: textColor }]}>
							Let's get your Circle profile ready
						</Text>

						<Pressable
							onPress={pickImage}
							style={styles.profileButton}
						>
							<View style={styles.profilePlaceholder}>
								<Ionicons
									name="person"
									size={54}
									color={
										theme === "dark"
											? "rgba(255,255,255,0.45)"
											: "rgba(0,0,0,0.35)"
									}
								/>

								<View style={styles.addButton}>
									<Ionicons
										name="add"
										size={20}
										color="#fff"
									/>
								</View>
							</View>
						</Pressable>

						<Text style={[styles.photoText, { color: textColor }]}>
							Add a profile picture
						</Text>

						<View style={styles.form}>
							<View
								style={[
									styles.inputContainer,
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
									style={[styles.input, { color: textColor }]}
									placeholder="Display name"
									placeholderTextColor={
										theme === "dark"
											? "rgba(255,255,255,0.45)"
											: "rgba(0,0,0,0.4)"
									}
									value={displayName}
									onChangeText={setDisplayName}
									autoCapitalize="words"
									autoCorrect={false}
								/>

								<View style={styles.separator}>
									<Separator />
								</View>

								<TextInput
									style={[styles.input, { color: textColor }]}
									placeholder="Username"
									placeholderTextColor={
										theme === "dark"
											? "rgba(255,255,255,0.45)"
											: "rgba(0,0,0,0.4)"
									}
									value={username}
									onChangeText={setUsername}
									autoCapitalize="none"
									autoCorrect={false}
								/>
							</View>
						</View>

						<Pressable
							style={styles.continueButton}
							onPress={async () => {
								await Haptics.selectionAsync();
								await createProfile();
							}}
						>
							<Text style={styles.continueText}>Continue</Text>
						</Pressable>

						<Text style={[styles.infoText, { color: textColor }]}>
							You can change these details later in your profile
							settings.
						</Text>
					</View>
				</View>
			</ImageBackground>
		</TouchableWithoutFeedback>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
	},

	background: {
		flex: 1,
	},

	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
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
		marginBottom: 30,
	},

	profileButton: {
		marginBottom: 10,
	},

	profilePlaceholder: {
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(128,128,128,0.18)",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.25)",
	},

	addButton: {
		position: "absolute",
		right: 0,
		bottom: 3,
		width: 34,
		height: 34,
		borderRadius: 17,
		backgroundColor: "#17b3da",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: "#fff",
	},

	photoText: {
		fontSize: 14,
		fontWeight: "600",
		opacity: 0.7,
		marginBottom: 30,
	},

	form: {
		width: "100%",
		maxWidth: 420,
	},

	inputContainer: {
		width: "100%",
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},

	input: {
		height: 54,
		paddingHorizontal: 20,
		justifyContent: "center",
	},

	placeholder: {
		fontSize: 16,
		opacity: 0.5,
	},

	separator: {
		marginHorizontal: 16,
	},

	continueButton: {
		width: "100%",
		maxWidth: 420,
		height: 52,
		borderRadius: 12,
		backgroundColor: "#17b3da",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 20,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "rgba(255,255,255,0.6)",
	},

	continueText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
	},

	infoText: {
		fontSize: 12,
		opacity: 0.5,
		textAlign: "center",
		lineHeight: 18,
		marginTop: 18,
		paddingHorizontal: 20,
	},
});
