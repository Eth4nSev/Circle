import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as ImagePicker from "expo-image-picker";
import { fileUriToArrayBuffer, optimizeImage } from "./utils/imageUpload";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Animated,
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

type Circle = {
	id: string;
	name: string;
	color: string;
	icon_type: string;
	icon_value: string | null;
};

export default function NewPost() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];
	const { accent } = useAccent();

	const [image, setImage] = useState<string | null>(null);
	const [imageRatio, setImageRatio] = useState(4 / 5);
	const [caption, setCaption] = useState("");
	const [allowComments, setAllowComments] = useState(true);
	const [allowSharing, setAllowSharing] = useState(true);
	const [allowReactions, setAllowReactions] = useState(true);
	const [pickingImage, setPickingImage] = useState(false);
	const [posting, setPosting] = useState(false);
	const [circles, setCircles] = useState<Circle[]>([]);
	const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
	const [showCircles, setShowCircles] = useState(false);
	const circleListAnimation = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.spring(circleListAnimation, {
			toValue: showCircles ? 1 : 0,
			useNativeDriver: false,
			damping: 18,
			stiffness: 180,
		}).start();
	}, [circleListAnimation, showCircles]);

	useEffect(() => {
		const loadCircles = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) return;

			const { data, error } = await supabase
				.from("circle_members")
				.select(
					`
				circle_id,
				circles (
					id,
					name,
					color,
					icon_type,
					icon_value
				)
			`,
				)
				.eq("user_id", user.id);

			if (error) {
				console.error("Failed to load circles:", error);
				return;
			}

			setCircles(
				(data ?? [])
					.map((item: any) => item.circles)
					.filter(Boolean)
					.sort((a: Circle, b: Circle) =>
						a.name.localeCompare(b.name),
					),
			);
		};

		loadCircles();
	}, []);

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

	async function createPost() {
		if (!image) {
			Alert.alert("Image Required", "Select an image before posting.");
			return;
		}

		setPosting(true);

		try {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				Alert.alert("Error", "You must be signed in to create a post.");
				return;
			}

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

			const { error: postError } = await supabase.from("posts").insert({
				user_id: user.id,
				image: publicData.publicUrl,
				caption: caption.trim() || null,
				circle_id: selectedCircle?.id ?? null,
				allow_comments: allowComments,
				allow_sharing: allowSharing,
				allow_reactions: allowReactions,
			});

			if (postError) {
				console.error(postError);
				Alert.alert("Post Failed", postError.message);
				return;
			}

			router.back();
		} catch (error) {
			console.error(error);
			Alert.alert(
				"Error",
				"Something went wrong while creating your post.",
			);
		} finally {
			setPosting(false);
		}
	}

	return (
		<>
			<ScrollView
				style={styles.scrollView}
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text }]}>
						New Post
					</Text>
				</View>

				<Pressable
					onPress={pickImage}
					disabled={pickingImage || posting}
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
					) : (
						<View style={styles.imagePickerWrapper}>
							<GlassView
								style={[
									styles.imagePicker,
									{
										backgroundColor: colors.clear,
										borderColor: colors.separator,
									},
								]}
							>
								{pickingImage ? (
									<ActivityIndicator
										size="small"
										color={colors.text}
									/>
								) : (
									<>
										<View
											style={[
												styles.imageIcon,
												{
													backgroundColor: accent,
												},
											]}
										>
											<Ionicons
												name="image-outline"
												size={25}
												color="#fff"
											/>
										</View>

										<Text
											style={[
												styles.selectTitle,
												{ color: colors.text },
											]}
										>
											Select Image
										</Text>

										<Text
											style={[
												styles.selectDescription,
												{ color: colors.secondary },
											]}
										>
											Choose a photo to share
										</Text>
									</>
								)}
							</GlassView>
						</View>
					)}
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
						Post To
					</Text>

					<GlassView
						style={[
							styles.postToContainer,
							{
								backgroundColor: colors.clear,
								borderColor: colors.separator,
							},
						]}
					>
						<Pressable
							onPress={() =>
								setShowCircles((current) => !current)
							}
							disabled={posting}
							style={styles.postToHeader}
						>
							<View style={styles.postToIcon}>
								{selectedCircle ? (
									<View
										style={[
											styles.circleIcon,
											{
												backgroundColor:
													selectedCircle.color ||
													accent,
											},
										]}
									>
										<Text style={styles.circleMonogram}>
											{selectedCircle.name
												.charAt(0)
												.toUpperCase()}
										</Text>
									</View>
								) : (
									<Ionicons
										name="globe-outline"
										size={23}
										color={colors.text}
									/>
								)}
							</View>

							<View style={styles.postToText}>
								<Text
									style={[
										styles.postToTitle,
										{ color: colors.text },
									]}
								>
									{selectedCircle?.name ?? "Public"}
								</Text>

								<Text
									style={[
										styles.postToDescription,
										{ color: colors.secondary },
									]}
								>
									{selectedCircle
										? "Only this Circle can see the post"
										: "Anyone can see this post"}
								</Text>
							</View>

							<Ionicons
								name={
									showCircles ? "chevron-up" : "chevron-down"
								}
								size={20}
								color={colors.secondary}
							/>
						</Pressable>

						<Animated.View
							pointerEvents={showCircles ? "auto" : "none"}
							style={{
								maxHeight: circleListAnimation.interpolate({
									inputRange: [0, 1],
									outputRange: [0, 1000],
								}),
								opacity: circleListAnimation,
								overflow: "hidden",
							}}
						>
							<View
								style={[
									styles.circleList,
									{ borderTopColor: colors.separator },
								]}
							>
								<Pressable
									onPress={() => setSelectedCircle(null)}
									style={styles.circleOption}
								>
									<View
										style={[
											styles.circleIcon,
											styles.publicCircleIcon,
										]}
									>
										<Ionicons
											name="globe-outline"
											size={20}
											color={colors.text}
										/>
									</View>

									<View style={styles.circleOptionText}>
										<Text
											style={[
												styles.circleOptionTitle,
												{ color: colors.text },
											]}
										>
											Public
										</Text>

										<Text
											style={[
												styles.circleOptionDescription,
												{ color: colors.secondary },
											]}
										>
											Anyone can see this post
										</Text>
									</View>

									{!selectedCircle && (
										<Ionicons
											name="checkmark-circle"
											size={22}
											color={accent}
										/>
									)}
								</Pressable>

								{circles.map((circle) => {
									const selected =
										selectedCircle?.id === circle.id;

									return (
										<Pressable
											key={circle.id}
											onPress={() =>
												setSelectedCircle(circle)
											}
											style={styles.circleOption}
										>
											<View
												style={[
													styles.circleIcon,
													{
														backgroundColor:
															circle.color ||
															accent,
													},
												]}
											>
												<Text
													style={
														styles.circleMonogram
													}
												>
													{circle.name
														.charAt(0)
														.toUpperCase()}
												</Text>
											</View>

											<View
												style={styles.circleOptionText}
											>
												<Text
													style={[
														styles.circleOptionTitle,
														{ color: colors.text },
													]}
												>
													{circle.name}
												</Text>

												<Text
													style={[
														styles.circleOptionDescription,
														{
															color: colors.secondary,
														},
													]}
												>
													Only Circle members can see
													this
												</Text>
											</View>

											{selected && (
												<Ionicons
													name="checkmark-circle"
													size={22}
													color={accent}
												/>
											)}
										</Pressable>
									);
								})}
							</View>
						</Animated.View>
					</GlassView>
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

						{/* <View
							style={[
								styles.settingSeparator,
								{ backgroundColor: colors.separator },
							]}
						/>

						<PostSetting
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
					onPress={createPost}
					disabled={!image || posting}
					style={[
						styles.postButtonContainer,
						{
							opacity: image && !posting ? 1 : 0.45,
						},
					]}
				>
					<GlassView
						tintColor={accent}
						isInteractive
						style={styles.postButton}
					>
						{posting ? (
							<ActivityIndicator color="#fff" />
						) : (
							<>
								<Ionicons
									name="paper-plane"
									size={18}
									color="#fff"
								/>
								<Text style={styles.postButtonText}>Post</Text>
							</>
						)}
					</GlassView>
				</Pressable>
			</ScrollView>

			<Pressable
				onPress={() => router.back()}
				disabled={posting}
				style={styles.closeButtonContainer}
			>
				<GlassView isInteractive style={styles.closeButton}>
					<MaterialIcons name="close" size={26} color={colors.text} />
				</GlassView>
			</Pressable>
		</>
	);
}

function PostSetting({
	icon,
	title,
	description,
	value,
	onValueChange,
	colors,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	description: string;
	value: boolean;
	onValueChange: (value: boolean) => void;
	colors: (typeof Colors)["light"];
}) {
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

			<View style={styles.settingSwitchContainer}>
				<Switch
					value={value}
					onValueChange={onValueChange}
					trackColor={{
						true: accent,
					}}
					thumbColor="#fff"
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
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

	imagePickerWrapper: {
		width: "100%",
		height: 210,
		borderRadius: 25,
		overflow: "hidden",
	},

	imagePicker: {
		width: "100%",
		height: "100%",
		alignItems: "center",
		justifyContent: "center",
		borderWidth: StyleSheet.hairlineWidth,
	},

	imageIcon: {
		width: 56,
		height: 56,
		borderRadius: 28,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 10,
	},

	selectTitle: {
		fontSize: 18,
		fontWeight: "700",
	},

	selectDescription: {
		fontSize: 14,
		marginTop: 4,
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

	settingSwitchContainer: {
		alignSelf: "stretch",
		justifyContent: "center",
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

	postButtonContainer: {
		width: "100%",
		height: 50,
		marginTop: 14,
		borderRadius: 25,
	},

	postButton: {
		width: "100%",
		height: 50,
		borderRadius: 25,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},

	postButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
	postToContainer: {
		borderRadius: 20,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},

	postToHeader: {
		minHeight: 70,
		paddingHorizontal: 14,
		paddingVertical: 10,
		flexDirection: "row",
		alignItems: "center",
	},

	postToIcon: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 11,
	},

	postToText: {
		flex: 1,
		paddingRight: 10,
	},

	postToTitle: {
		fontSize: 15,
		fontWeight: "600",
	},

	postToDescription: {
		fontSize: 12,
		marginTop: 3,
	},

	circleList: {
		borderTopWidth: StyleSheet.hairlineWidth,
		paddingVertical: 4,
	},

	circleOption: {
		minHeight: 62,
		paddingHorizontal: 14,
		paddingVertical: 9,
		flexDirection: "row",
		alignItems: "center",
	},

	circleIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 11,
	},

	publicCircleIcon: {},

	circleMonogram: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},

	circleOptionText: {
		flex: 1,
		paddingRight: 8,
	},

	circleOptionTitle: {
		fontSize: 15,
		fontWeight: "600",
	},

	circleOptionDescription: {
		fontSize: 12,
		marginTop: 2,
	},
});
