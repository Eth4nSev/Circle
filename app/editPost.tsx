import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as ImagePicker from "expo-image-picker";
import { fileUriToArrayBuffer, optimizeImage } from "./utils/imageUpload";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TextInput,
	useColorScheme,
	View,
} from "react-native";
import { useAccent } from "./context/accent";

type PostSettingProps = {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	description: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
	colors: (typeof Colors)["light"];
};

function PostSetting({
	icon,
	title,
	description,
	value,
	onValueChange,
	colors,
}: PostSettingProps) {
	const { accent } = useAccent();
	return (
		<View style={styles.settingRow}>
			<View style={styles.settingIcon}>
				<Ionicons name={icon} size={21} color={colors.text} />
			</View>

			<View style={styles.settingText}>
				<Text style={[styles.settingTitle, { color: colors.text }]}>
					{title}
				</Text>

				<Text
					style={[
						styles.settingDescription,
						{ color: colors.secondary },
					]}
				>
					{description}
				</Text>
			</View>

			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{
					true: accent,
				}}
				thumbColor="#fff"
			/>
		</View>
	);
}

export default function EditPost() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];
	const { accent } = useAccent();

	const { postId } = useLocalSearchParams<{ postId: string }>();

	const [image, setImage] = useState<string | null>(null);
	const [imageRatio, setImageRatio] = useState(4 / 5);
	const [caption, setCaption] = useState("");

	const [allowComments, setAllowComments] = useState(true);
	const [allowSharing, setAllowSharing] = useState(true);
	const [allowReactions, setAllowReactions] = useState(true);

	const [loading, setLoading] = useState(true);
	const [pickingImage, setPickingImage] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!postId) {
			Alert.alert("Error", "Post could not be found.");
			router.back();
			return;
		}

		loadPost();
	}, [postId]);

	async function loadPost() {
		setLoading(true);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				Alert.alert("Error", "You must be signed in.");
				router.back();
				return;
			}

			const { data, error } = await supabase
				.from("posts")
				.select(
					"image, caption, allow_comments, allow_sharing, allow_reactions, user_id",
				)
				.eq("id", postId)
				.single();

			if (error || !data) {
				console.error("Error loading post:", error);
				Alert.alert("Error", "Unable to load this post.");
				router.back();
				return;
			}

			if (data.user_id !== user.id) {
				Alert.alert("Not Allowed", "You can only edit your own posts.");
				router.back();
				return;
			}

			setImage(data.image);
			setCaption(data.caption ?? "");
			setAllowComments(data.allow_comments ?? true);
			setAllowSharing(data.allow_sharing ?? true);
			setAllowReactions(data.allow_reactions ?? true);

			Image.getSize(
				data.image,
				(width, height) => {
					if (width && height) {
						setImageRatio(width / height);
					}
				},
				() => {
					setImageRatio(4 / 5);
				},
			);
		} catch (error) {
			console.error("Error loading post:", error);
			Alert.alert(
				"Error",
				"Something went wrong while loading the post.",
			);
			router.back();
		} finally {
			setLoading(false);
		}
	}

	async function pickImage() {
		setPickingImage(true);

		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: false,
				quality: 0.8,
			});

			if (!result.canceled && result.assets[0]?.uri) {
				const asset = result.assets[0];

				const optimized = await optimizeImage({
					uri: asset.uri,
					maxWidth: 1080,
					quality: 0.78,
				});

				setImage(optimized.uri);
				setImageRatio(optimized.width / optimized.height);
			}
		} catch (error) {
			console.error("Image picker error:", error);
		} finally {
			setPickingImage(false);
		}
	}

	async function saveChanges() {
		if (!image || !postId) return;

		setSaving(true);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				Alert.alert("Error", "You must be signed in.");
				return;
			}

			let imageUrl = image;

			const { data: existingPost, error: postFetchError } = await supabase
				.from("posts")
				.select("image, user_id")
				.eq("id", postId)
				.single();

			if (postFetchError || !existingPost) {
				Alert.alert("Error", "Unable to find this post.");
				return;
			}

			if (existingPost.user_id !== user.id) {
				Alert.alert("Not Allowed", "You can only edit your own posts.");
				return;
			}

			if (image !== existingPost.image) {
				const arrayBuffer = await fileUriToArrayBuffer(image);
				const fileName = `${user.id}/${Date.now()}.jpg`;

				const { error: uploadError } = await supabase.storage
					.from("posts")
					.upload(fileName, arrayBuffer, {
						contentType: "image/jpeg",
						cacheControl: "31536000",
						upsert: false,
					});

				if (uploadError) {
					console.error(uploadError);
					Alert.alert("Upload Failed", uploadError.message);
					return;
				}

				const { data: publicData } = supabase.storage
					.from("posts")
					.getPublicUrl(fileName);

				imageUrl = publicData.publicUrl;
			}

			const { error: updateError } = await supabase
				.from("posts")
				.update({
					image: imageUrl,
					caption: caption.trim() || null,
					allow_comments: allowComments,
					allow_sharing: allowSharing,
					allow_reactions: allowReactions,
				})
				.eq("id", postId)
				.eq("user_id", user.id);

			if (updateError) {
				console.error(updateError);
				Alert.alert("Save Failed", updateError.message);
				return;
			}

			router.back();
		} catch (error) {
			console.error("Error saving post:", error);
			Alert.alert(
				"Error",
				"Something went wrong while saving your changes.",
			);
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return (
			<View
				style={[
					styles.loadingContainer,
					{ backgroundColor: colors.background },
				]}
			>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<>
			<ScrollView
				style={[styles.scrollView]}
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text }]}>
						Edit Post
					</Text>
				</View>

				<Pressable
					onPress={pickImage}
					disabled={pickingImage || saving}
				>
					{image ? (
						<View
							style={[
								styles.previewContainer,
								{
									aspectRatio: imageRatio,
								},
							]}
						>
							<Image
								source={{ uri: image }}
								style={styles.previewImage}
							/>

							<GlassView
								tintColor={accent}
								isInteractive
								style={styles.changeButton}
							>
								{pickingImage ? (
									<ActivityIndicator
										size="small"
										color="#fff"
									/>
								) : (
									<>
										<Ionicons
											name="pencil"
											size={16}
											color="#fff"
										/>
										<Text style={styles.changeText}>
											Change
										</Text>
									</>
								)}
							</GlassView>
						</View>
					) : null}
				</Pressable>

				<View style={styles.captionSection}>
					<Text style={[styles.label, { color: colors.text }]}>
						Caption
					</Text>

					<TextInput
						value={caption}
						onChangeText={setCaption}
						placeholder="Add a caption..."
						placeholderTextColor={colors.secondary}
						multiline
						maxLength={500}
						textAlignVertical="top"
						style={[
							styles.captionInput,
							{
								color: colors.text,
								backgroundColor: colors.clear,
								borderColor: colors.separator,
							},
						]}
					/>

					<Text
						style={[
							styles.characterCount,
							{ color: colors.secondary },
						]}
					>
						{caption.length}/500
					</Text>
				</View>

				<View style={styles.settingsSection}>
					<Text style={[styles.label, { color: colors.text }]}>
						Post Settings
					</Text>

					<GlassView
						style={[
							styles.settingsContainer,
							{
								backgroundColor: colors.clear,
								borderColor: colors.separator,
							},
						]}
					>
						<PostSetting
							icon="chatbubble-outline"
							title="Allow Comments"
							description="Let people comment on your post"
							value={allowComments}
							onValueChange={setAllowComments}
							colors={colors}
						/>

						<View
							style={[
								styles.settingSeparator,
								{ backgroundColor: colors.separator },
							]}
						/>

						{/* <PostSetting
							icon="share-outline"
							title="Allow Sharing"
							description="Let people share your post"
							value={allowSharing}
							onValueChange={setAllowSharing}
							colors={colors}
						/>

						<View
							style={[
								styles.settingSeparator,
								{ backgroundColor: colors.separator },
							]}
						/>

						<PostSetting
							icon="happy-outline"
							title="Allow Emoji Reactions"
							description="Let people react with emojis"
							value={allowReactions}
							onValueChange={setAllowReactions}
							colors={colors}
						/> */}
					</GlassView>
				</View>

				<Pressable
					onPress={saveChanges}
					disabled={saving}
					style={[
						styles.saveButtonContainer,
						{
							opacity: saving ? 0.45 : 1,
						},
					]}
				>
					<GlassView
						tintColor={accent}
						isInteractive
						style={styles.saveButton}
					>
						{saving ? (
							<ActivityIndicator color="#fff" />
						) : (
							<>
								<Ionicons
									name="checkmark"
									size={19}
									color="#fff"
								/>
								<Text style={styles.saveButtonText}>
									Save Changes
								</Text>
							</>
						)}
					</GlassView>
				</Pressable>
			</ScrollView>

			<Pressable
				onPress={() => router.back()}
				disabled={saving}
				style={styles.closeButtonContainer}
			>
				<GlassView isInteractive style={styles.closeButton}>
					<MaterialIcons name="close" size={26} color={colors.text} />
				</GlassView>
			</Pressable>
		</>
	);
}

const styles = StyleSheet.create({
	loadingContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},

	scrollView: {
		flex: 1,
	},

	content: {
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 24,
	},

	header: {
		height: 50,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 16,
	},

	title: {
		fontSize: 28,
		fontWeight: "700",
	},

	closeButtonContainer: {
		position: "absolute",
		top: 16,
		right: 16,
		zIndex: 999,
	},

	closeButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		alignItems: "center",
		justifyContent: "center",
	},

	previewContainer: {
		width: "100%",
		maxHeight: 520,
		borderRadius: 22,
		overflow: "hidden",
		position: "relative",
		backgroundColor: "#000",
	},

	previewImage: {
		width: "100%",
		height: "100%",
		resizeMode: "contain",
	},

	changeButton: {
		position: "absolute",
		right: 10,
		bottom: 10,
		height: 38,
		paddingHorizontal: 13,
		borderRadius: 19,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
	},

	changeText: {
		color: "#fff",
		fontSize: 14,
		fontWeight: "600",
	},

	captionSection: {
		marginTop: 16,
	},

	label: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 7,
	},

	captionInput: {
		height: 82,
		borderRadius: 20,
		borderWidth: StyleSheet.hairlineWidth,
		paddingHorizontal: 15,
		paddingVertical: 12,
		fontSize: 16,
	},

	characterCount: {
		fontSize: 11,
		textAlign: "right",
		marginTop: 4,
	},

	settingsSection: {
		marginTop: 16,
	},

	settingsContainer: {
		borderRadius: 20,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},

	settingRow: {
		minHeight: 72,
		paddingHorizontal: 14,
		paddingVertical: 12,
		flexDirection: "row",
		alignItems: "center",
	},

	settingIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 11,
	},

	settingText: {
		flex: 1,
		paddingRight: 10,
	},

	settingTitle: {
		fontSize: 15,
		fontWeight: "600",
	},

	settingDescription: {
		fontSize: 12,
		marginTop: 3,
	},

	settingSeparator: {
		height: StyleSheet.hairlineWidth,
		marginLeft: 65,
	},

	saveButtonContainer: {
		width: "100%",
		height: 50,
		marginTop: 14,
		borderRadius: 25,
	},

	saveButton: {
		width: "100%",
		height: 50,
		borderRadius: 25,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},

	saveButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
});
