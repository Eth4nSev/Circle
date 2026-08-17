import ProfileSetupInput from "@/components/accountManagement/profileSetupInput";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
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

export default function profileSetup() {
	const theme = useColorScheme() ?? "light";
	const textColor = Colors[theme].text;

	const backgroundImage =
		theme === "dark"
			? require("@/assets/images/loginbackground-dark.png")
			: require("@/assets/images/loginbackground-light.png");

	const [displayName, setDisplayName] = useState("");
	const [username, setUsername] = useState("");
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const [isCreating, setIsCreating] = useState(false);
	const [isPickingImage, setIsPickingImage] = useState(false);

	const pickImage = async () => {
		setIsPickingImage(true);

		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				aspect: [1, 1],
				quality: 0.8,
			});

			if (!result.canceled) {
				setProfileImage(result.assets[0].uri);
			}
		} finally {
			setIsPickingImage(false);
		}
	};

	const cancelSetup = async () => {
		const { error } = await supabase.functions.invoke("delete-account");

		if (error) {
			console.error("Account deletion failed:", error);
			Alert.alert(
				"Couldn't cancel setup",
				"Your account could not be deleted. Please try again.",
			);
			return;
		}

		await supabase.auth.signOut();
		router.replace("/login");
	};

	const generateUsername = async (name: string) => {
		const baseUsername = name.toLowerCase().replace(/[^a-z0-9]/g, "");

		if (!baseUsername) {
			setUsername("");
			return;
		}

		let generatedUsername = baseUsername;

		const { data: existingUser } = await supabase
			.from("profiles")
			.select("username")
			.eq("username", generatedUsername)
			.maybeSingle();

		if (existingUser) {
			let isAvailable = false;

			while (!isAvailable) {
				const numbers = Math.floor(1000 + Math.random() * 9000);
				generatedUsername = `${baseUsername}${numbers}`;

				const { data } = await supabase
					.from("profiles")
					.select("username")
					.eq("username", generatedUsername)
					.maybeSingle();

				isAvailable = !data;
			}
		}

		setUsername(generatedUsername);
	};

	/* const createProfile = async () => {
		if (!displayName.trim() || !username.trim()) {
			Alert.alert(
				"Missing information",
				"Please enter a display name and username.",
			);
			return;
		}

		if (isCreating) return;

		setIsCreating(true);

		try {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();
			console.log("USER ID:", user?.id);

			const {
				data: { session },
			} = await supabase.auth.getSession();

			console.log("SESSION USER ID:", session?.user.id);
			console.log(
				"SESSION ACCESS TOKEN EXISTS:",
				!!session?.access_token,
			);

			if (userError || !user) {
				Alert.alert("Error", "You are not currently signed in.");
				return;
			}

			console.log("USER ID:", user.id);

			const {
				data: { session },
			} = await supabase.auth.getSession();

			console.log("SESSION USER ID:", session?.user.id);
			console.log(
				"SESSION ACCESS TOKEN EXISTS:",
				!!session?.access_token,
			);

			let avatarUrl: string | null = null;

			if (profileImage) {
				const response = await fetch(profileImage);
				const arrayBuffer = await response.arrayBuffer();

				const filePath = `${user.id}.jpg`;

				const { error: uploadError } = await supabase.storage
					.from("profile-pictures")
					.upload(filePath, arrayBuffer, {
						contentType: "image/jpeg",
						upsert: true,
					});

				if (uploadError) {
					throw uploadError;
				}

				const { data: publicUrl } = supabase.storage
					.from("profile-pictures")
					.getPublicUrl(filePath);

				avatarUrl = publicUrl.publicUrl;
			}

			const profileData = {
				id: user.id,
				display_name: displayName.trim(),
				username: username.trim(),
				avatar_url: avatarUrl,
			};

			console.log("INSERTING PROFILE:", profileData);

			const { data: insertedProfile, error: profileError } =
				await supabase
					.from("profiles")
					.insert(profileData)
					.select()
					.single();

			console.log("INSERTED PROFILE:", insertedProfile);
			console.log("PROFILE ERROR:", profileError);

			if (profileError) {
				throw profileError;
			}

			router.replace("/");
		} catch (error) {
			console.error("Profile setup failed:", error);

			Alert.alert(
				"Profile setup failed",
				error instanceof Error
					? error.message
					: "Something went wrong.",
			);
		} finally {
			setIsCreating(false);
		}
	}; */

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
								{profileImage ? (
									<Image
										source={{ uri: profileImage }}
										style={styles.profileImage}
									/>
								) : (
									<Ionicons
										name="person"
										size={54}
										color={
											theme === "dark"
												? "rgba(255,255,255,0.45)"
												: "rgba(0,0,0,0.35)"
										}
									/>
								)}

								<GlassView
									tintColor="#17b3da"
									style={styles.addButton}
									isInteractive
								>
									{isPickingImage ? (
										<ActivityIndicator
											size="small"
											color="#fff"
										/>
									) : (
										<Ionicons
											name={
												profileImage ? "pencil" : "add"
											}
											size={20}
											color="#fff"
										/>
									)}
								</GlassView>
							</View>
						</Pressable>

						<Text style={[styles.photoText, { color: textColor }]}>
							Add a profile picture
						</Text>

						<View style={styles.form}>
							<View style={styles.form}>
								<ProfileSetupInput
									displayName={displayName}
									username={username}
									setDisplayName={setDisplayName}
									setUsername={setUsername}
									generateUsername={generateUsername}
								/>
							</View>
						</View>

						<Pressable
							style={[
								styles.continueButtonContainer,
								{ opacity: isCreating ? 0.6 : 1 },
							]}
							disabled={isCreating}
							onPress={async () => {
								await Haptics.selectionAsync();
								//await createProfile();
							}}
						>
							<GlassView
								tintColor="#17b3da"
								style={styles.continueButton}
								isInteractive
							>
								<Text style={styles.continueText}>
									{isCreating
										? "Creating profile..."
										: "Continue"}
								</Text>
							</GlassView>
						</Pressable>
						<Pressable
							style={styles.cancelButton}
							onPress={async () => {
								await Haptics.selectionAsync();
								await cancelSetup();
							}}
						>
							<Text
								style={[
									styles.cancelText,
									{ color: textColor },
								]}
							>
								Cancel
							</Text>
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
		alignItems: "center",
		justifyContent: "center",
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

	continueButtonContainer: {
		width: "100%",
		maxWidth: 420,
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 20,
	},

	continueButton: {
		width: "100%",
		maxWidth: 420,
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
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
	cancelButton: {
		marginTop: 16,
		paddingVertical: 8,
	},

	cancelText: {
		fontSize: 15,
		fontWeight: "600",
		opacity: 0.7,
	},
	profileImage: {
		width: 120,
		height: 120,
		borderRadius: 60,
	},
});
