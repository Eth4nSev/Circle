import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { Button, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	Animated,
	Pressable,
	RefreshControl,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function Index() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];

	const [posts, setPosts] = useState<any[]>([]);
	const [circles, setCircles] = useState<any[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const [selectedCircles, setSelectedCircles] = useState<string[]>([]);
	const [selectedFeed, setSelectedFeed] = useState<"all" | "following">(
		"all",
	);

	const [selectedCircleName, setSelectedCircleName] = useState("Home");

	const scrollY = useRef(new Animated.Value(0)).current;

	const clampedScrollY = scrollY.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 1],
		extrapolateLeft: "clamp",
	});

	const translateY = Animated.diffClamp(clampedScrollY, 0, 200);

	async function getPosts(
		circleIds: string[] = selectedCircles,
		isRefreshing = false,
		feed: "all" | "following" = selectedFeed,
	) {
		if (isRefreshing) setRefreshing(true);

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			setPosts([]);
			setRefreshing(false);
			return;
		}

		const followedUserIds = await getFollowedUserIds();

		let query = supabase
			.from("posts")
			.select("*")
			.order("created_at", { ascending: false });

		if (circleIds.length > 0) {
			query = query.in("circle_id", circleIds);
		} else if (feed === "following") {
			if (followedUserIds.length === 0) {
				setPosts([]);
				setRefreshing(false);
				return;
			}

			query = query.in("user_id", followedUserIds);
		} else {
			const { data: memberships, error: membershipError } = await supabase
				.from("circle_members")
				.select("circle_id")
				.eq("user_id", user.id);

			if (membershipError) {
				console.error(
					"Error fetching circle memberships:",
					membershipError,
				);
				setPosts([]);
				setRefreshing(false);
				return;
			}

			const memberCircleIds = (memberships ?? []).map(
				(membership) => membership.circle_id,
			);

			const filters = [
				`user_id.in.(${[...new Set(followedUserIds)].join(",")})`,
			];

			if (memberCircleIds.length > 0) {
				filters.push(`circle_id.in.(${memberCircleIds.join(",")})`);
			}

			query = query.or(filters.join(","));
		}

		const { data, error } = await query;

		if (error) {
			console.error("Error fetching posts:", error);
		} else {
			setPosts(data ?? []);
		}

		if (isRefreshing) setRefreshing(false);
	}

	const circleButtonWidth = useMemo(() => {
		const estimatedTextWidth = selectedCircleName.length * 11;

		return Math.max(100, estimatedTextWidth + 40);
	}, [selectedCircleName]);

	async function getFollowedUserIds() {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) return [];

		const { data, error } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", user.id);

		if (error) {
			console.error("Error fetching follows:", error);
			return [];
		}

		return [user.id, ...(data ?? []).map((follow) => follow.following_id)];
	}

	async function getCircles() {
		const {
			data: { user },
		} = await supabase.auth.getUser();

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

	function toggleCircle(circleId: string, circleName: string) {
		const isSelected = selectedCircles.includes(circleId);

		let updatedCircles: string[];

		if (isSelected) {
			updatedCircles = selectedCircles.filter((id) => id !== circleId);
		} else {
			updatedCircles = [...selectedCircles, circleId];
		}

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

		getPosts(updatedCircles, false, "all");
	}

	function selectAll() {
		setSelectedFeed("all");
		setSelectedCircles([]);
		setSelectedCircleName("Home");
		getPosts([], false, "all");
	}

	useEffect(() => {
		getPosts();
		getCircles();
	}, []);

	return (
		<>
			<Animated.ScrollView
				style={{
					backgroundColor: colors.background,
					flex: 1,
				}}
				contentInsetAdjustmentBehavior="automatic"
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={() => getPosts(selectedCircles, true)}
						tintColor={colors.text}
					/>
				}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: true },
				)}
				scrollEventThrottle={16}
			>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Host matchContents style={{ marginLeft: 8 }}>
						<Menu
							label={
								<RNHostView matchContents>
									<GlassView
										style={{
											width: circleButtonWidth,
											height: 50,
											paddingVertical: 5,
											justifyContent: "center",
											alignItems: "center",
											margin: 10,
											borderRadius: 50,
										}}
										isInteractive
									>
										<Text
											style={{
												color: colors.text,
												fontWeight: "bold",
												fontSize: 20,
											}}
										>
											{selectedCircleName}
										</Text>
									</GlassView>
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
									getPosts([], false, "following");
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
							href={post.image}
							caption={post.caption}
						/>
					))
				)}
			</Animated.ScrollView>

			{/* <Animated.View
				style={{
					width: "100%",
					justifyContent: "center",
					alignItems: "center",
					position: "absolute",
					bottom: 100,
					transform: [{ translateY: translateY }],
				}}
			>
				<AddPost href="/newPost" />
			</Animated.View> */}
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

	glassButtonMini: {
		width: 50,
		height: 50,
		paddingVertical: 5,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 50,
	},
});
