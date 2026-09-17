import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Platform,
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

const circleColors = [
	"#17b3da",
	"#8E7CFF",
	"#FF6B6B",
	"#FFB547",
	"#4CAF50",
	"#EC4899",
	"#F97316",
	"#6366F1",
];

type Friend = {
	id: string;
	username?: string;
	display_name?: string;
	avatar_url?: string;
};

export default function CreateCircle() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];
	const { accent } = useAccent();

	const [name, setName] = useState("");
	const [selectedColor, setSelectedColor] = useState(accent);
	const [icon, setIcon] = useState("");
	const [chatEnabled, setChatEnabled] = useState(true);
	const [creating, setCreating] = useState(false);

	const [friends, setFriends] = useState<Friend[]>([]);
	const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
	const [loadingFriends, setLoadingFriends] = useState(true);

	useEffect(() => {
		loadMutualFriends();
	}, []);

	async function loadMutualFriends() {
		setLoadingFriends(true);

		try {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				setFriends([]);
				return;
			}

			const { data: following, error: followingError } = await supabase
				.from("follows")
				.select("following_id")
				.eq("follower_id", user.id);

			if (followingError) {
				console.error(followingError);
				setFriends([]);
				return;
			}

			const { data: followers, error: followersError } = await supabase
				.from("follows")
				.select("follower_id")
				.eq("following_id", user.id);

			if (followersError) {
				console.error(followersError);
				setFriends([]);
				return;
			}

			const followingIds = new Set(
				(following ?? []).map((item) => item.following_id),
			);

			const mutualIds = (followers ?? [])
				.map((item) => item.follower_id)
				.filter((id) => followingIds.has(id));

			if (mutualIds.length === 0) {
				setFriends([]);
				return;
			}

			const { data: profiles, error: profilesError } = await supabase
				.from("profiles")
				.select("id, username, display_name, avatar_url")
				.in("id", mutualIds);

			if (profilesError) {
				console.error(profilesError);
				setFriends([]);
				return;
			}

			setFriends(profiles ?? []);
		} catch (error) {
			console.error(error);
			setFriends([]);
		} finally {
			setLoadingFriends(false);
		}
	}

	function toggleFriend(id: string) {
		setSelectedFriends((current) =>
			current.includes(id)
				? current.filter((friendId) => friendId !== id)
				: [...current, id],
		);
	}

	async function createCircle() {
		const cleanName = name.trim();

		if (!cleanName) {
			Alert.alert("Name Required", "Enter a name for your Circle.");
			return;
		}

		setCreating(true);

		try {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				Alert.alert(
					"Error",
					"You must be signed in to create a Circle.",
				);
				return;
			}

			const { data: circle, error: circleError } = await supabase
				.from("circles")
				.insert({
					name: cleanName,
					color: selectedColor,
					icon_type: icon.trim() ? "emoji" : "monogram",
					icon_value:
						icon.trim() || cleanName.charAt(0).toUpperCase(),
					chat_enabled: chatEnabled,
					created_by: user.id,
				})
				.select()
				.single();

			if (circleError) {
				console.error(circleError);
				Alert.alert("Creation Failed", circleError.message);
				return;
			}

			const { error: memberError } = await supabase
				.from("circle_members")
				.insert({
					circle_id: circle.id,
					user_id: user.id,
					role: "admin",
				});

			if (memberError) {
				console.error(memberError);

				await supabase.from("circles").delete().eq("id", circle.id);

				Alert.alert("Creation Failed", memberError.message);
				return;
			}

			if (selectedFriends.length > 0) {
				const invitations = selectedFriends.map((friendId) => ({
					circle_id: circle.id,
					inviter_id: user.id,
					invitee_id: friendId,
					status: "pending",
				}));

				const { error: invitationError } = await supabase
					.from("circle_invitations")
					.insert(invitations);

				if (invitationError) {
					console.error(invitationError);

					await supabase
						.from("circle_members")
						.delete()
						.eq("circle_id", circle.id);

					await supabase.from("circles").delete().eq("id", circle.id);

					Alert.alert("Creation Failed", invitationError.message);

					return;
				}
			}

			router.replace({
				pathname: "/circle",
				params: { id: circle.id },
			});
		} catch (error) {
			console.error(error);

			Alert.alert(
				"Error",
				"Something went wrong while creating your Circle.",
			);
		} finally {
			setCreating(false);
		}
	}

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<ScrollView
				style={styles.scrollView}
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
			>
				<View style={styles.header}>
					<Text style={[styles.title, { color: colors.text }]}>
						Create Circle
					</Text>

					<Pressable
						onPress={() => router.back()}
						disabled={creating}
					>
						<GlassView isInteractive style={styles.closeButton}>
							<MaterialIcons
								name="close"
								size={28}
								color={colors.text}
							/>
						</GlassView>
					</Pressable>
				</View>

				<View style={styles.previewSection}>
					<View
						style={[
							styles.circlePreview,
							{ backgroundColor: selectedColor },
						]}
					>
						<Text style={styles.previewText}>
							{icon.trim()
								? icon.trim()
								: name.trim()
									? name.trim().charAt(0).toUpperCase()
									: "C"}
						</Text>
					</View>

					<Text
						style={[styles.previewName, { color: colors.text }]}
						numberOfLines={1}
					>
						{name.trim() || "Your Circle"}
					</Text>

					<Text
						style={[
							styles.previewDescription,
							{ color: colors.secondary },
						]}
					>
						Customize your Circle
					</Text>
				</View>

				<View style={styles.form}>
					<View style={styles.field}>
						<Text style={[styles.label, { color: colors.text }]}>
							Circle Name
						</Text>

						<TextInput
							value={name}
							onChangeText={setName}
							placeholder="Family, Friends, Gaming..."
							placeholderTextColor={colors.secondary}
							maxLength={50}
							style={[
								styles.input,
								{
									color: colors.text,
									backgroundColor: colors.clear,
									borderColor: colors.separator,
								},
							]}
							autoCapitalize="words"
							returnKeyType="done"
						/>

						<Text
							style={[
								styles.characterCount,
								{ color: colors.secondary },
							]}
						>
							{name.length}/50
						</Text>
					</View>

					<View style={styles.field}>
						<Text style={[styles.label, { color: colors.text }]}>
							Circle Icon
						</Text>

						<View
							style={[
								styles.iconInput,
								{
									backgroundColor: colors.clear,
									borderColor: colors.separator,
								},
							]}
						>
							<TextInput
								value={icon}
								onChangeText={setIcon}
								placeholder="Optional emoji"
								placeholderTextColor={colors.secondary}
								maxLength={2}
								style={[
									styles.iconTextInput,
									{ color: colors.text },
								]}
								autoCorrect={false}
							/>

							<Text
								style={[
									styles.iconHint,
									{ color: colors.secondary },
								]}
							>
								Leave empty to use a monogram
							</Text>
						</View>
					</View>

					<View style={styles.field}>
						<Text style={[styles.label, { color: colors.text }]}>
							Circle Color
						</Text>

						<GlassView
							style={[
								styles.colorContainer,
								{
									backgroundColor: colors.clear,
									borderColor: colors.separator,
								},
							]}
						>
							<View style={styles.colorGrid}>
								{circleColors.map((color) => {
									const selected = selectedColor === color;

									return (
										<Pressable
											key={color}
											onPress={() =>
												setSelectedColor(color)
											}
											style={[
												styles.colorOption,
												{ backgroundColor: color },
												selected &&
													styles.selectedColor,
											]}
										>
											{selected && (
												<Ionicons
													name="checkmark"
													size={21}
													color="#fff"
												/>
											)}
										</Pressable>
									);
								})}
							</View>
						</GlassView>
					</View>

					<View style={styles.field}>
						<View style={styles.labelRow}>
							<Text
								style={[styles.label, { color: colors.text }]}
							>
								Invite Friends
							</Text>

							{selectedFriends.length > 0 && (
								<Text
									style={[
										styles.selectedCount,
										{ color: accent },
									]}
								>
									{selectedFriends.length} selected
								</Text>
							)}
						</View>

						<GlassView
							style={[
								styles.friendsContainer,
								{
									backgroundColor: colors.clear,
									borderColor: colors.separator,
								},
							]}
						>
							{loadingFriends ? (
								<View style={styles.loadingFriends}>
									<ActivityIndicator color={accent} />
									<Text
										style={[
											styles.loadingText,
											{ color: colors.secondary },
										]}
									>
										Finding mutual friends...
									</Text>
								</View>
							) : friends.length === 0 ? (
								<View style={styles.emptyFriends}>
									<Ionicons
										name="people-outline"
										size={28}
										color={colors.secondary}
									/>

									<Text
										style={[
											styles.emptyFriendsTitle,
											{ color: colors.text },
										]}
									>
										No mutual friends yet
									</Text>

									<Text
										style={[
											styles.emptyFriendsDescription,
											{ color: colors.secondary },
										]}
									>
										People you mutually follow will appear
										here.
									</Text>
								</View>
							) : (
								friends.map((friend, index) => {
									const selected = selectedFriends.includes(
										friend.id,
									);

									const displayName =
										friend.display_name ||
										friend.username ||
										"Circle member";

									return (
										<Pressable
											key={friend.id}
											onPress={() =>
												toggleFriend(friend.id)
											}
											style={[
												styles.friendRow,
												index < friends.length - 1 && {
													borderBottomWidth:
														StyleSheet.hairlineWidth,
													borderBottomColor:
														colors.separator,
												},
											]}
										>
											{friend.avatar_url ? (
												<Image
													source={{
														uri: friend.avatar_url,
													}}
													style={styles.friendAvatar}
												/>
											) : (
												<View
													style={[
														styles.friendAvatar,
														{
															backgroundColor:
																accent,
														},
													]}
												>
													<Text
														style={
															styles.friendAvatarText
														}
													>
														{displayName
															.charAt(0)
															.toUpperCase()}
													</Text>
												</View>
											)}

											<View style={styles.friendInfo}>
												<Text
													style={[
														styles.friendName,
														{
															color: colors.text,
														},
													]}
													numberOfLines={1}
												>
													{displayName}
												</Text>

												{friend.username &&
													friend.display_name && (
														<Text
															style={[
																styles.friendUsername,
																{
																	color: colors.secondary,
																},
															]}
															numberOfLines={1}
														>
															@{friend.username}
														</Text>
													)}
											</View>

											<View
												style={[
													styles.selectionCircle,
													{
														borderColor: selected
															? accent
															: colors.separator,
														backgroundColor:
															selected
																? accent
																: "transparent",
													},
												]}
											>
												{selected && (
													<Ionicons
														name="checkmark"
														size={16}
														color="#fff"
													/>
												)}
											</View>
										</Pressable>
									);
								})
							)}
						</GlassView>
					</View>

					<View style={styles.field}>
						<Text style={[styles.label, { color: colors.text }]}>
							Circle Settings
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
							<View style={styles.settingRow}>
								<View style={styles.settingIcon}>
									<Ionicons
										name="chatbubble-outline"
										size={21}
										color={colors.text}
									/>
								</View>

								<View style={styles.settingText}>
									<Text
										style={[
											styles.settingTitle,
											{ color: colors.text },
										]}
									>
										Circle Chat
									</Text>

									<Text
										style={[
											styles.settingDescription,
											{ color: colors.secondary },
										]}
									>
										Give this Circle its own group chat
									</Text>
								</View>

								<Switch
									value={chatEnabled}
									onValueChange={setChatEnabled}
									trackColor={{
										true: accent,
									}}
									thumbColor="#fff"
								/>
							</View>
						</GlassView>
					</View>
				</View>

				<Pressable
					onPress={createCircle}
					disabled={creating || !name.trim()}
					style={[
						styles.createButtonContainer,
						{
							opacity: name.trim() && !creating ? 1 : 0.45,
						},
					]}
				>
					<GlassView
						tintColor={accent}
						isInteractive
						style={styles.createButton}
					>
						{creating ? (
							<ActivityIndicator color="#fff" />
						) : (
							<>
								<Ionicons
									name="add-circle-outline"
									size={19}
									color="#fff"
								/>

								<Text style={styles.createButtonText}>
									Create Circle
								</Text>
							</>
						)}
					</GlassView>
				</Pressable>

				<Text style={[styles.footerText, { color: colors.secondary }]}>
					Circles are private spaces for the people you choose. Each
					Circle can have up to 50 members.
				</Text>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},

	content: {
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 30,
	},

	header: {
		height: 50,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 20,
	},

	title: {
		fontSize: 28,
		fontWeight: "700",
	},

	closeButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		alignItems: "center",
		justifyContent: "center",
	},

	previewSection: {
		alignItems: "center",
		marginBottom: 28,
	},

	circlePreview: {
		width: 110,
		height: 110,
		borderRadius: 55,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},

	previewText: {
		color: "#fff",
		fontSize: 40,
		fontWeight: "700",
	},

	previewName: {
		fontSize: 20,
		fontWeight: "700",
		maxWidth: "80%",
	},

	previewDescription: {
		fontSize: 13,
		marginTop: 3,
	},

	form: {
		gap: 18,
	},

	field: {
		gap: 7,
	},

	labelRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	label: {
		fontSize: 14,
		fontWeight: "600",
	},

	selectedCount: {
		fontSize: 12,
		fontWeight: "600",
	},

	input: {
		height: 48,
		borderRadius: 30,
		paddingHorizontal: 15,
		fontSize: 16,
		borderWidth: StyleSheet.hairlineWidth,
	},

	characterCount: {
		fontSize: 11,
		textAlign: "right",
		marginTop: -2,
	},

	iconInput: {
		minHeight: 48,
		borderRadius: 30,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 15,
		borderWidth: StyleSheet.hairlineWidth,
	},

	iconTextInput: {
		width: 110,
		fontSize: 16,
	},

	iconHint: {
		flex: 1,
		fontSize: 12,
		textAlign: "right",
	},

	colorContainer: {
		borderRadius: 20,
		borderWidth: StyleSheet.hairlineWidth,
		padding: 15,
	},

	colorGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 14,
	},

	colorOption: {
		width: 43,
		height: 43,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
	},

	selectedColor: {
		borderWidth: 3,
		borderColor: "#fff",
	},

	friendsContainer: {
		borderRadius: 20,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
	},

	loadingFriends: {
		minHeight: 90,
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
	},

	loadingText: {
		fontSize: 12,
	},

	emptyFriends: {
		minHeight: 130,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 25,
		paddingVertical: 20,
	},

	emptyFriendsTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginTop: 8,
	},

	emptyFriendsDescription: {
		fontSize: 12,
		textAlign: "center",
		marginTop: 4,
		lineHeight: 17,
	},

	friendRow: {
		minHeight: 68,
		paddingHorizontal: 14,
		flexDirection: "row",
		alignItems: "center",
	},

	friendAvatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 11,
	},

	friendAvatarText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
	},

	friendInfo: {
		flex: 1,
		paddingRight: 10,
	},

	friendName: {
		fontSize: 15,
		fontWeight: "600",
	},

	friendUsername: {
		fontSize: 12,
		marginTop: 2,
	},

	selectionCircle: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
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

	createButtonContainer: {
		width: "100%",
		height: 52,
		marginTop: 20,
		borderRadius: 30,
	},

	createButton: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},

	createButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},

	footerText: {
		marginTop: 10,
		textAlign: "center",
		fontSize: 12,
		lineHeight: 18,
		opacity: 0.55,
	},
});
