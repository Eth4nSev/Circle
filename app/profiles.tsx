import { supabase } from "@/app/utils/supabase";
import Back from "@/components/Back";
import PostContainer from "@/components/post";
import SupabaseImage from "@/components/SupabaseImage";
import { fetchPostPage, type FeedPost } from "./utils/postFeed";
import { getCurrentUser } from "./utils/auth";
import { sendNotification } from "./utils/notifications";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";
import { useAccent } from "./context/accent";

export default function ProfileScreen() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];
	const { accent } = useAccent();
	const { id: userId } = useLocalSearchParams<{ id: string }>();

	const [posts, setPosts] = useState<FeedPost[]>([]);
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const [displayName, setDisplayName] = useState("Display Name");
	const [username, setUsername] = useState("username");
	const [accountType, setAccountType] = useState<"public" | "private" | null>(null);
	const [followerCount, setFollowerCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [followStatus, setFollowStatus] = useState<"none" | "pending" | "accepted">("none");
	const [isMutual, setIsMutual] = useState(false);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);

	const [refreshing, setRefreshing] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);

	async function refreshData() {
		setRefreshing(true);

		try {
			if (!userId) return;

			const user = await getCurrentUser();
			if (!user) {
				console.error("No signed-in user.");
				return;
			}

			setCurrentUserId(user.id);

			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("id, avatar_url, display_name, username, account_type")
				.eq("id", userId)
				.single();

			if (profileError) {
				console.error("Error fetching profile:", profileError);
				return;
			}

			setProfileImage(profile.avatar_url ?? null);
			setDisplayName(profile.display_name ?? "Display Name");
			setUsername(profile.username ?? "username");
			setAccountType(profile.account_type ?? null);

			const [{ count: followers, error: followersError }, { count: following, error: followingError }] =
				await Promise.all([
					supabase
						.from("follows")
						.select("*", { count: "exact", head: true })
						.eq("following_id", userId)
						.eq("status", "accepted"),
					supabase
						.from("follows")
						.select("*", { count: "exact", head: true })
						.eq("follower_id", userId)
						.eq("status", "accepted"),
				]);

			if (followersError) {
				console.error("Error fetching followers:", followersError);
			} else {
				setFollowerCount(followers ?? 0);
			}

			if (followingError) {
				console.error("Error fetching following:", followingError);
			} else {
				setFollowingCount(following ?? 0);
			}

			let nextFollowStatus: "none" | "pending" | "accepted" = "none";

			if (user.id !== userId) {
				const { data: follow, error: followError } = await supabase
					.from("follows")
					.select("id, status")
					.eq("follower_id", user.id)
					.eq("following_id", userId)
					.maybeSingle();

				if (followError) {
					console.error("Error checking follow status:", followError);
				} else if (follow) {
					nextFollowStatus = follow.status === "pending" ? "pending" : "accepted";
				}
			}

			setFollowStatus(nextFollowStatus);

			if (nextFollowStatus === "accepted" && user.id !== userId) {
				const { data: reverseFollow } = await supabase
					.from("follows")
					.select("id")
					.eq("follower_id", userId)
					.eq("following_id", user.id)
					.eq("status", "accepted")
					.maybeSingle();

				setIsMutual(!!reverseFollow);
			} else {
				setIsMutual(false);
			}

			const canViewPosts =
				user.id === userId ||
				profile.account_type === "public" ||
				nextFollowStatus === "accepted";

			if (canViewPosts) {
				const result = await fetchPostPage({
					mode: { type: "user", userId },
					currentUserId: user.id,
					page: 0,
					pageSize: 20,
				});
				setPosts(result.posts);
			} else {
				setPosts([]);
			}
		} finally {
			setRefreshing(false);
		}
	}

	async function toggleFollow() {
		if (!userId || !currentUserId || currentUserId === userId) return;

		setFollowLoading(true);

		try {
			if (followStatus === "accepted") {
				const { error } = await supabase
					.from("follows")
					.delete()
					.eq("follower_id", currentUserId)
					.eq("following_id", userId)
					.eq("status", "accepted");

				if (error) {
					console.error("Error unfollowing user:", error);
					return;
				}

				setFollowStatus("none");
				setIsMutual(false);
				setFollowerCount((count) => Math.max(0, count - 1));
				return;
			}

			if (followStatus === "pending") {
				const { error } = await supabase
					.from("follows")
					.delete()
					.eq("follower_id", currentUserId)
					.eq("following_id", userId)
					.eq("status", "pending");

				if (error) {
					console.error("Error cancelling follow request:", error);
					return;
				}

				setFollowStatus("none");
				return;
			}

			const status = accountType === "private" ? "pending" : "accepted";
			const { data: follow, error } = await supabase
				.from("follows")
				.insert({
					follower_id: currentUserId,
					following_id: userId,
					status,
				})
				.select("id, status")
				.single();

			if (error) {
				console.error("Error following user:", error);
				return;
			}

			setFollowStatus(status);

			if (status === "accepted") {
				setFollowerCount((count) => count + 1);
			} else if (follow?.id) {
				await sendNotification({
					recipientId: userId,
					type: "follow_request",
					data: {
						followId: follow.id,
						actorId: currentUserId,
					},
				});
			}
		} finally {
			setFollowLoading(false);
		}
	}

	function handleFollowPress() {
		if (followStatus === "accepted") {
			Alert.alert(
				"Unfollow user?",
				`Are you sure you want to unfollow ${displayName}?`,
				[
					{ text: "Cancel", style: "cancel" },
					{ text: "Unfollow", style: "destructive", onPress: toggleFollow },
				],
			);
			return;
		}

		if (followStatus === "pending") {
			Alert.alert(
				"Cancel follow request?",
				`Your request to follow ${displayName} will be removed.`,
				[
					{ text: "Keep Request", style: "cancel" },
					{ text: "Cancel Request", style: "destructive", onPress: toggleFollow },
				],
			);
			return;
		}

		toggleFollow();
	}

	useEffect(() => {
		refreshData();
	}, [userId]);

	const isOwnProfile = currentUserId === userId;
	const canViewPosts =
		isOwnProfile || accountType === "public" || followStatus === "accepted";

	return (
		<>
			<Stack.Screen
				options={{
					headerBackTitle: "",
				}}
			/>

			<Back />

			<View
				style={[
					styles.container,
					{
						backgroundColor: colors.background,
					},
				]}
			>
				{/* <View style={styles.settingsButton}>
					<GlassContainer
						style={styles.glassButtonContainer}
						spacing={10}
					>
						<GlassView isInteractive style={styles.glassButtonMini}>
							<Ionicons
								name="chatbubble-outline"
								size={23}
								color={colors.text}
							/>
						</GlassView>
						<GlassView isInteractive style={styles.glassButton}>
							<Octicons
								name="bell-slash"
								size={24}
								color={colors.text}
							/>
							<Host matchContents>
								<Menu
									label={
										<RNHostView matchContents>
											<MaterialIcons
												name="more-horiz"
												size={27}
												color={
													Colors[
														theme as
															| "light"
															| "dark"
													].text
												}
											/>
										</RNHostView>
									}
								>
									<Button
										systemImage="square.and.arrow.up"
										label="Share"
									/>
									<Button
										systemImage="person.2"
										label="Invite to Circle"
									/>
									<Button
										systemImage="circle.slash"
										label="Block"
									/>
									<Button
										systemImage="exclamationmark.bubble"
										label="Report"
									/>
								</Menu>
							</Host>
						</GlassView>
					</GlassContainer>
				</View> */}

				{profileImage && (
					<>
						<SupabaseImage
							uri={profileImage}
							blurRadius={10}
							style={{
								width: "100%",
								height: 300,
								position: "absolute",
							}}
						/>

						<LinearGradient
							colors={["transparent", colors.background]}
							style={styles.profileImageFade}
							pointerEvents="none"
						/>
					</>
				)}

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={styles.content}
					contentInsetAdjustmentBehavior="automatic"
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={refreshData}
						/>
					}
				>
					<View style={styles.profileHeader}>
						<View style={styles.profilePicture}>
							{profileImage ? (
								<Image
									source={{ uri: profileImage }}
									style={[
										styles.profilePictureImage,
										{
											borderColor:
												Colors[
													theme as "light" | "dark"
												].separator,
										},
									]}
								/>
							) : (
								<MaterialIcons
									name="person"
									size={55}
									color={colors.secondary}
								/>
							)}
						</View>

						<Text
							style={[
								styles.displayName,
								{
									color: colors.text,
								},
							]}
						>
							{displayName}
						</Text>

						<Text
							style={[
								styles.username,
								{
									color: colors.secondary,
								},
							]}
						>
							@{username}
						</Text>
					</View>

					<View style={styles.statsContainer}>
						<View
							style={[
								styles.statCard,
								{
									backgroundColor: colors.stats,
								},
							]}
						>
							<Text
								style={[
									styles.statNumber,
									{
										color: colors.text,
									},
								]}
							>
								{followerCount}
							</Text>

							<Text
								style={[
									styles.statLabel,
									{
										color: colors.secondary,
									},
								]}
							>
								Followers
							</Text>
						</View>
						<View
							style={[
								styles.statCard,
								{
									backgroundColor: colors.stats,
								},
							]}
						>
							<Text
								style={[
									styles.statNumber,
									{
										color: colors.text,
									},
								]}
							>
								{followingCount}
							</Text>

							<Text
								style={[
									styles.statLabel,
									{
										color: colors.secondary,
									},
								]}
							>
								Following
							</Text>
						</View>

						<View
							style={[
								styles.statCard,
								{
									backgroundColor: colors.stats,
								},
							]}
						>
							<Text
								style={[
									styles.statNumber,
									{
										color: colors.text,
									},
								]}
							>
								{posts.length}
							</Text>

							<Text
								style={[
									styles.statLabel,
									{
										color: colors.secondary,
									},
								]}
							>
								Posts
							</Text>
						</View>
					</View>

					<View
						style={[
							styles.followButtonContainer,
							{ flexDirection: "row", gap: 5 },
						]}
					>
						{!isOwnProfile && (
							<Pressable
								style={styles.followAction}
								onPress={handleFollowPress}
								disabled={followLoading}
							>
								<GlassView
									tintColor={
										followStatus === "accepted" ||
										followStatus === "pending"
											? colors.separator
											: accent
									}
									style={styles.followButton}
									isInteractive
								>
									<Ionicons
										name="person-add"
										color={
												followStatus === "accepted" ||
												followStatus === "pending"
													? colors.text
													: "#fff"
											}
										size={17}
									/>
									<Text
										style={[
											styles.followButtonText,
											{
												color:
												followStatus === "accepted" ||
												followStatus === "pending"
													? colors.text
													: "#fff",
											},
										]}
									>
										{followLoading ? (
											<ActivityIndicator
												size="small"
												color="#fff"
											/>
										) : followStatus === "accepted" ? (
											"Following"
										) : followStatus === "pending" ? (
											"Requested"
										) : (
											"Follow"
										)}
									</Text>
								</GlassView>
							</Pressable>
						)}
						{isMutual ? (
							<Pressable
								style={styles.followAction}
								onPress={() =>
									router.push({
										pathname: "/dm",
										params: {
											userId: userId,
										},
									})
								}
							>
								<GlassView
									isInteractive
									style={[
										styles.followButton,
										{ flexDirection: "row", gap: 5 },
									]}
									tintColor={colors.separator}
								>
									<Ionicons
										name="chatbubble-outline"
										size={17}
										color={colors.text}
									/>
									<Text
										style={[
											styles.followButtonText,
											{ color: colors.text },
										]}
									>
										Chat
									</Text>
								</GlassView>
							</Pressable>
						) : null}
					</View>

					<View style={styles.postSection}>
						<Text
							style={[
								styles.sectionTitle,
								{ color: colors.text },
							]}
						>
							Posts
						</Text>

						{!canViewPosts && accountType === "private" ? (
							<View style={styles.privatePosts}>
								<MaterialIcons
									name="lock-outline"
									size={42}
									color={colors.secondary}
								/>
								<Text style={[styles.privatePostsTitle, { color: colors.text }]}>
									This account is private
								</Text>
								<Text style={[styles.privatePostsText, { color: colors.secondary }]}>
									Follow this account and get approved to see their posts.
								</Text>
							</View>
						) : (
							posts.map((post) => (
								<PostContainer
									key={post.id}
									userId={post.user_id}
									id={post.id}
									time={post.created_at}
									href={post.image ?? ""}
									caption={post.caption}
									profile={post.profiles}
									postSettings={{
										allow_comments: post.allow_comments,
										allow_sharing: post.allow_sharing,
										allow_reactions: post.allow_reactions,
									}}
									likeCount={post.like_count}
									isLiked={post.is_liked}
									currentUserId={currentUserId ?? ""}
								/>
							))
						)}
					</View>
					</View>
				</ScrollView>
			</View>
			{/* <StatusBar barStyle={"light-content"} /> */}
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	content: {
		paddingHorizontal: 16,
	},

	settingsButton: {
		position: "absolute",
		right: 16,
		zIndex: 999,
		top: 60,
	},

	profileImageFade: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 300,
	},

	glassButtonContainer: {
		flexDirection: "row",
		gap: 10,
		justifyContent: "center",
		alignItems: "center",
	},

	glassButton: {
		width: 100,
		flexDirection: "row",
		gap: 25,
		height: 50,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
	},
	glassButtonMini: {
		width: 50,
		flexDirection: "row",
		gap: 25,
		height: 50,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
	},

	contextMenu: {
		position: "absolute",
		top: 58,
		right: 0,
		width: 210,
		borderRadius: 18,
		paddingVertical: 6,
	},

	contextMenuItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},

	contextMenuText: {
		fontSize: 15,
	},

	profileHeader: {
		alignItems: "center",
		paddingTop: 45,
	},

	profilePicture: {
		width: 110,
		height: 110,
		borderRadius: 55,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(128, 128, 128, 0.2)",
		marginBottom: 14,
		overflow: "hidden",
	},

	profilePictureImage: {
		width: "100%",
		height: "100%",
		borderRadius: 55,
		borderWidth: StyleSheet.hairlineWidth,
	},

	displayName: {
		fontSize: 26,
		fontWeight: "700",
	},

	username: {
		fontSize: 16,
		marginTop: 3,
	},

	statsContainer: {
		flexDirection: "row",
		gap: 10,
		marginTop: 28,
	},

	statCard: {
		flex: 1,
		alignItems: "center",
		paddingVertical: 16,
		borderRadius: 18,
	},

	statNumber: {
		fontSize: 20,
		fontWeight: "700",
	},

	statLabel: {
		fontSize: 13,
		marginTop: 3,
	},

	postSection: {
		marginTop: 16,
		marginHorizontal: -16,
	},

	sectionTitle: {
		fontSize: 21,
		fontWeight: "700",
		marginBottom: 12,
		marginHorizontal: 16,
	},

	privatePosts: {
		minHeight: 220,
		marginHorizontal: 16,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 28,
	},

	privatePostsTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginTop: 12,
	},

	privatePostsText: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
		marginTop: 5,
	},

	followButtonContainer: {
		width: "100%",
		height: 52,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 20,
		borderRadius: 30,
	},

	followAction: {
		flex: 1,
	},

	followButton: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 5,
	},

	followButtonText: {
		fontSize: 17,
		fontWeight: "700",
	},
});
