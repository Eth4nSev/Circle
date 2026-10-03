import PostContainer from "@/components/post";
import { fetchPostPage, type FeedPost } from "../utils/postFeed";
import { getCurrentUser } from "../utils/auth";
import { Colors } from "@/styles/colors";
import { Button, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
	NativeScrollEvent,
	NativeSyntheticEvent,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function Index() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];

	const [posts, setPosts] = useState<FeedPost[]>([]);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [circles, setCircles] = useState<any[]>([]);
	const [refreshing, setRefreshing] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);

	const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
	const [selectedFeed, setSelectedFeed] = useState<"all" | "following">(
		"all",
	);

	const [selectedCircleName, setSelectedCircleName] = useState("Home");


	async function getFollowedUserIds(userId: string) {
		const { data, error } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", userId)
			.eq("status", "accepted");

		if (error) {
			console.error("Error fetching follows:", error);
			return [userId];
		}

		return [userId, ...(data ?? []).map((follow) => follow.following_id)];
	}

	async function getCircles() {
		const user = await getCurrentUser();

		if (!user) return;

		const { data, error } = await supabase
			.from("circle_members")
			.select("circle_id, circles(id, name)")
			.eq("user_id", user.id);

		if (error) {
			console.error("Error fetching circles:", error);
		} else {
			setCircles(
				(data ?? [])
					.map((membership) => membership.circles)
					.filter(Boolean),
			);
		}
	}

	async function getPosts(
		circleIds: string[] = selectedCircles,
		isRefreshing = false,
		feed: "all" | "following" = selectedFeed,
		nextPage = 0,
		append = false,
	) {
		if (append) {
			if (loadingMore || !hasMore) return;
			setLoadingMore(true);
		} else if (isRefreshing || nextPage === 0) {
			setRefreshing(isRefreshing);
		}

		try {
			const user = await getCurrentUser();

			if (!user) {
				setCurrentUserId(null);
				setPosts([]);
				setHasMore(false);
				return;
			}

			setCurrentUserId(user.id);

			let mode;

			if (circleIds.length > 0) {
				mode = {
					type: "circles" as const,
					circleIds,
				};
			} else if (feed === "following") {
				const followedUserIds = await getFollowedUserIds(user.id);
				mode = {
					type: "following" as const,
					userIds: followedUserIds,
				};
			} else {
				const [followedUserIds, membershipResult] = await Promise.all([
					getFollowedUserIds(user.id),
					supabase
						.from("circle_members")
						.select("circle_id")
						.eq("user_id", user.id),
				]);

				if (membershipResult.error) {
					throw membershipResult.error;
				}

				mode = {
					type: "home" as const,
					followedUserIds,
					memberCircleIds: (membershipResult.data ?? []).map(
						(membership) => membership.circle_id,
					),
				};
			}

			const result = await fetchPostPage({
				mode,
				currentUserId: user.id,
				page: nextPage,
				pageSize: 20,
			});

			setPosts((current) =>
				append ? [...current, ...result.posts] : result.posts,
			);
			setPage(nextPage);
			setHasMore(result.hasMore);
		} catch (error) {
			console.error("Error fetching posts:", error);
		} finally {
			setLoadingMore(false);
			setRefreshing(false);
		}
	}

	function toggleCircle(circleId: string, circleName: string) {
		const isSelected = selectedCircles.includes(circleId);

		const updatedCircles = isSelected
			? selectedCircles.filter((id) => id !== circleId)
			: [...selectedCircles, circleId];

		setSelectedFeed("all");
		setSelectedCircles(updatedCircles);

		if (updatedCircles.length === 0) {
			setSelectedCircleName("Home");
		} else if (updatedCircles.length === 1) {
			const selectedCircle = circles.find(
				(circle) => circle.id === updatedCircles[0],
			);

			setSelectedCircleName(selectedCircle?.name ?? circleName);
		} else {
			setSelectedCircleName(`${updatedCircles.length} Circles`);
		}

		getPosts(updatedCircles, false, "all", 0, false);
	}


	function selectAll() {
		setSelectedFeed("all");
		setSelectedCircles([]);
		setSelectedCircleName("Home");
		getPosts([], false, "all", 0, false);
	}

	useEffect(() => {
		getPosts([], false, "all", 0, false);
		getCircles();
	}, []);

	function handleScroll(
		event: NativeSyntheticEvent<NativeScrollEvent>,
	) {
		const { contentOffset, contentSize, layoutMeasurement } =
			event.nativeEvent;

		if (
			contentOffset.y + layoutMeasurement.height >=
			contentSize.height - 800
		) {
			getPosts(
				selectedCircles,
				false,
				selectedFeed,
				page + 1,
				true,
			);
		}
	}

	return (
		<>
			<ScrollView
				style={{
					backgroundColor: colors.background,
					flex: 1,
				}}
				contentInsetAdjustmentBehavior="automatic"
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={() =>
					getPosts(selectedCircles, true, selectedFeed, 0, false)
				}
						tintColor={colors.text}
					/>
				}
				onScroll={handleScroll}
				scrollEventThrottle={250}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Host matchContents style={{ marginLeft: 16 }}>
						<Menu
							label={
								<RNHostView matchContents>
									<Text
										style={{
											color: colors.text,
											fontWeight: "bold",
											fontSize: 25,
										}}
									>
										{selectedCircleName}
									</Text>
								</RNHostView>
							}
						>
								</RNHostView>
							}
						>
							<Button
								systemImage={
									selectedFeed === "all" &&
									selectedCircles.length === 0
										? "checkmark"
										: "globe"
								}
								label="All"
								onPress={selectAll}
							/>

							<Button
								systemImage={
									selectedFeed === "following"
										? "checkmark"
										: "person.2"
								}
								label="Following"
								onPress={() => {
									setSelectedFeed("following");
									setSelectedCircles([]);
									setSelectedCircleName("Following");
									getPosts([], false, "following", 0, false);
								}}
							/>

							<Menu systemImage="person.2.fill" label="Circles">
								{circles.map((circle) => {
									const isSelected = selectedCircles.includes(
										circle.id,
									);

									return (
										<Button
											key={circle.id}
											systemImage={
												isSelected
													? "checkmark.circle"
													: "circle"
											}
											label={circle.name}
											onPress={() =>
												toggleCircle(
													circle.id,
													circle.name,
												)
											}
										/>
									);
								})}
							</Menu>
						</Menu>
					</Host>

					<GlassContainer
						spacing={10}
						style={{
							flexDirection: "row",
							gap: 10,
							marginRight: 10,
						}}
					>
						<Pressable onPress={() => router.push("/notifications")}>
							<GlassView
								style={styles.glassButtonMini}
								isInteractive
							>
								<Ionicons
									name="notifications-outline"
									size={27}
									color={colors.text}
								/>
							</GlassView>
						</Pressable>

						<Pressable onPress={() => router.push("/newPost")}>
							<GlassView
								style={styles.glassButtonMini}
								isInteractive
							>
								<Ionicons
									name="add"
									size={30}
									color={colors.text}
								/>
							</GlassView>
						</Pressable>
					</GlassContainer>
				</View>

				{posts.length === 0 ? (
					<View
						style={[
							styles.emptyPosts,
							{
								backgroundColor: colors.stats,
							},
						]}
					>
						<MaterialIcons
							name="photo-library"
							size={42}
							color={colors.secondary}
						/>

						<Text
							style={[
								styles.emptyTitle,
								{
									color: colors.text,
								},
							]}
						>
							No posts yet
						</Text>

						<Text
							style={[
								styles.emptyDescription,
								{
									color: colors.secondary,
								},
							]}
						>
							Posts from people you follow will appear here.
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
			</ScrollView>

		</>
	);
}

const styles = StyleSheet.create({
	emptyPosts: {
		minHeight: 220,
		borderRadius: 22,
		marginHorizontal: 16,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},

	emptyTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginTop: 12,
	},

	emptyDescription: {
		fontSize: 14,
		textAlign: "center",
		marginTop: 5,
		maxWidth: 280,
	},

	loadingMore: {
		paddingVertical: 16,
		alignItems: "center",
	},

	glassButtonMini: {
		width: 50,
		height: 50,
		paddingVertical: 5,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 50,
	},
});
