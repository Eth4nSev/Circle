import { supabase } from "@/app/utils/supabase";
import Back from "@/components/Back";
import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { Button, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import { Ionicons, MaterialIcons, Octicons } from "@expo/vector-icons";
import { GlassContainer, GlassView } from "expo-glass-effect";
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
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function ProfileScreen() {
	const theme = useColorScheme() ?? "light";
	const { id: userId } = useLocalSearchParams<{ id: string }>();

	const [posts, setPosts] = useState<any[]>([]);
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const [displayName, setDisplayName] = useState("Display Name");
	const [username, setUsername] = useState("username");

	const [followerCount, setFollowerCount] = useState(0);
	const [followingCount, setFollowingCount] = useState(0);
	const [isFollowing, setIsFollowing] = useState(false);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);

	const [refreshing, setRefreshing] = useState(false);
	const [followLoading, setFollowLoading] = useState(false);

	async function refreshData() {
		setRefreshing(true);

		try {
			if (!userId) return;

			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				console.error("Error fetching current user:", userError);
				return;
			}

			setCurrentUserId(user.id);

			const { data: profile, error: profileError } = await supabase
				.from("profiles")
				.select("id, avatar_url, display_name, username")
				.eq("id", userId)
				.single();

			if (profileError) {
				console.error("Error fetching profile:", profileError);
			} else if (profile) {
				setProfileImage(profile.avatar_url ?? null);
				setDisplayName(profile.display_name ?? "Display Name");
				setUsername(profile.username ?? "username");
			}

			const { data: userPosts, error: postsError } = await supabase
				.from("posts")
				.select("*")
				.eq("user_id", userId)
				.order("created_at", { ascending: false });

			if (postsError) {
				console.error("Error fetching posts:", postsError);
			} else {
				setPosts(userPosts ?? []);
			}

			const { count: followers, error: followersError } = await supabase
				.from("follows")
				.select("*", { count: "exact", head: true })
				.eq("following_id", userId);

			if (followersError) {
				console.error("Error fetching followers:", followersError);
			} else {
				setFollowerCount(followers ?? 0);
			}

			const { count: following, error: followingError } = await supabase
				.from("follows")
				.select("*", { count: "exact", head: true })
				.eq("follower_id", userId);

			if (followingError) {
				console.error("Error fetching following:", followingError);
			} else {
				setFollowingCount(following ?? 0);
			}

			if (user.id !== userId) {
				const { data: follow, error: followError } = await supabase
					.from("follows")
					.select("follower_id")
					.eq("follower_id", user.id)
					.eq("following_id", userId)
					.maybeSingle();

				if (followError) {
					console.error("Error checking follow status:", followError);
				} else {
					setIsFollowing(!!follow);
				}
			}
		} finally {
			setRefreshing(false);
		}
	}

	async function toggleFollow() {
		if (!userId || !currentUserId || currentUserId === userId) {
			return;
		}

		setFollowLoading(true);

		try {
			if (isFollowing) {
				const { error } = await supabase
					.from("follows")
					.delete()
					.eq("follower_id", currentUserId)
					.eq("following_id", userId);

				if (error) {
					console.error("Error unfollowing user:", error);
					return;
				}

				setIsFollowing(false);
				setFollowerCount((count) => Math.max(0, count - 1));
			} else {
				const { error } = await supabase.from("follows").insert({
					follower_id: currentUserId,
					following_id: userId,
				});

				if (error) {
					console.error("Error following user:", error);
					return;
				}

				setIsFollowing(true);
				setFollowerCount((count) => count + 1);
			}
		} finally {
			setFollowLoading(false);
		}
	}

	function handleFollowPress() {
		if (isFollowing) {
			Alert.alert(
				"Unfollow user?",
				`Are you sure you want to unfollow ${displayName}?`,
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Unfollow",
						style: "destructive",
						onPress: toggleFollow,
					},
				],
			);
			return;
		}

		toggleFollow();
	}

	useEffect(() => {
		refreshData();
	}, [userId]);

	const [isMutual, setIsMutual] = useState(false);

	useEffect(() => {
		const checkMutualFollow = async () => {
			if (!userId || !currentUserId || userId === currentUserId) {
				setIsMutual(false);
				return;
			}

			const { data, error } = await supabase
				.from("follows")
				.select("follower_id, following_id")
				.or(
					`and(follower_id.eq.${currentUserId},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${currentUserId})`,
				);

			if (error) {
				console.error("Error checking mutual follow:", error);
				setIsMutual(false);
				return;
			}

			const followingThem = data?.some(
				(follow) =>
					follow.follower_id === currentUserId &&
					follow.following_id === userId,
			);

			const followingYou = data?.some(
				(follow) =>
					follow.follower_id === userId &&
					follow.following_id === currentUserId,
			);

			setIsMutual(!!followingThem && !!followingYou);
		};

		checkMutualFollow();
	}, [userId, currentUserId]);

	const isOwnProfile = currentUserId === userId;

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
						backgroundColor:
							Colors[theme as "light" | "dark"].background,
					},
				]}
			>
				<View style={styles.settingsButton}>
					<GlassContainer
						style={styles.glassButtonContainer}
						spacing={10}
					>
						{/* <GlassView isInteractive style={styles.glassButtonMini}>
              <Ionicons
                name="chatbubble-outline"
                size={23}
                color={Colors[theme as "light" | "dark"].text}
              />
            </GlassView> */}
						<GlassView isInteractive style={styles.glassButton}>
							<Octicons
								name="bell-slash"
								size={24}
								color={Colors[theme as "light" | "dark"].text}
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
				</View>

				{profileImage && (
					<>
						<Image
							source={{ uri: profileImage }}
							blurRadius={10}
							style={{
								width: "100%",
								height: 300,
								position: "absolute",
							}}
						/>

						<LinearGradient
							colors={[
								"transparent",
								Colors[theme as "light" | "dark"].background,
							]}
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
									color={
										Colors[theme as "light" | "dark"]
											.secondary
									}
								/>
							)}
						</View>

						<Text
							style={[
								styles.displayName,
								{
									color: Colors[theme as "light" | "dark"]
										.text,
								},
							]}
						>
							{displayName}
						</Text>

						<Text
							style={[
								styles.username,
								{
									color: Colors[theme as "light" | "dark"]
										.secondary,
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
									backgroundColor:
										Colors[theme as "light" | "dark"].stats,
								},
							]}
						>
							<Text
								style={[
									styles.statNumber,
									{
										color: Colors[theme as "light" | "dark"]
											.text,
									},
								]}
							>
								{followerCount}
							</Text>

							<Text
								style={[
									styles.statLabel,
									{
										color: Colors[theme as "light" | "dark"]
											.secondary,
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
									backgroundColor:
										Colors[theme as "light" | "dark"].stats,
								},
							]}
						>
							<Text
								style={[
									styles.statNumber,
									{
										color: Colors[theme as "light" | "dark"]
											.text,
									},
								]}
							>
								{followingCount}
							</Text>

							<Text
								style={[
									styles.statLabel,
									{
										color: Colors[theme as "light" | "dark"]
											.secondary,
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
									backgroundColor:
										Colors[theme as "light" | "dark"].stats,
								},
							]}
						>
							<Text
								style={[
									styles.statNumber,
									{
										color: Colors[theme as "light" | "dark"]
											.text,
									},
								]}
							>
								{posts.length}
							</Text>

							<Text
								style={[
									styles.statLabel,
									{
										color: Colors[theme as "light" | "dark"]
											.secondary,
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
										isFollowing
											? Colors[theme as "light" | "dark"]
													.separator
											: Colors.accent
									}
									style={styles.followButton}
									isInteractive
								>
									<Text
										style={[
											styles.followButtonText,
											isFollowing && {
												color: Colors[
													theme as "light" | "dark"
												].text,
											},
										]}
									>
										{followLoading ? (
											<ActivityIndicator
												size="small"
												color="#fff"
											/>
										) : isFollowing ? (
											"Following"
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
									tintColor={
										Colors[theme as "light" | "dark"]
											.separator
									}
								>
									<Ionicons
										name="chatbubble-outline"
										size={20}
										color={
											Colors[theme as "light" | "dark"]
												.text
										}
									/>
									<Text style={styles.followButtonText}>
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
								{
									color: Colors[theme as "light" | "dark"]
										.text,
								},
							]}
						>
							Posts
						</Text>

						{posts.map((post) => (
							<PostContainer
								key={post.id}
								userId={post.user_id}
								id={post.id}
								time={post.created_at}
								href={post.image}
								caption={post.caption}
							/>
						))}
					</View>
				</ScrollView>
			</View>
			<StatusBar barStyle={"light-content"} />
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
		width: 110,
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
	},

	followButtonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
	},
});
