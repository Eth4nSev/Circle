import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function ProfileScreen() {
	const theme = useColorScheme() ?? "light";
	const [posts, setPosts] = useState<any[]>([]);
	const [profileImage, setProfileImage] = useState<string | null>(null);
	const [displayName, setDisplayName] = useState("Display Name");
	const [username, setUsername] = useState("username");

	useEffect(() => {
		async function getProfile() {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				console.error("Error fetching auth user:", userError);
				return;
			}

			const { data, error } = await supabase
				.from("profiles")
				.select("avatar_url, display_name, username")
				.eq("id", user.id)
				.single();

			if (error) {
				console.error("Error fetching profile:", error);
				return;
			}

			if (data?.avatar_url) {
				setProfileImage(data.avatar_url);
				setDisplayName(data.display_name);
				setUsername(data.username);
			}
		}

		async function getPosts() {
			const { data, error } = await supabase.from("posts").select("*");

			if (error) {
				console.error("Error fetching posts:", error);
				return;
			}

			setPosts(data ?? []);
		}

		getProfile();
		getPosts();
	}, []);

	return (
		<View
			style={[styles.container, { backgroundColor: Colors[theme].background }]}
		>
			<Pressable style={styles.settingsButton}>
				<Link href="/settings">
					<GlassView isInteractive style={styles.glassButton}>
						<MaterialIcons
							name="settings"
							size={24}
							color={Colors[theme].text}
						/>
					</GlassView>
				</Link>
			</Pressable>
			<Pressable style={styles.editButton}>
				<GlassView isInteractive style={styles.glassButton}>
					<Ionicons
						name="pencil"
						color={Colors[theme].text}
						size={24}
					/>
				</GlassView>
			</Pressable>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior="automatic"
			>

				<View style={styles.profileHeader}>
					<View style={styles.profilePicture}>
						{profileImage ? (
							<Image
								source={{ uri: profileImage }}
								style={styles.profilePictureImage}
							/>
						) : (
							<MaterialIcons
								name="person"
								size={55}
								color={Colors[theme].secondary}
							/>
						)}
					</View>

					<Text style={[styles.displayName, { color: Colors[theme].text }]}>
						{displayName}
					</Text>

					<Text
						style={[styles.username, { color: Colors[theme].secondary }]}
					>
						@{username}
					</Text>
				</View>

				<View style={styles.statsContainer}>
					<View
						style={[
							styles.statCard,
							{ backgroundColor: Colors[theme].card },
						]}
					>
						<Text
							style={[styles.statNumber, { color: Colors[theme].text }]}
						>
							0
						</Text>
						<Text
							style={[
								styles.statLabel,
								{ color: Colors[theme].secondary },
							]}
						>
							Followers
						</Text>
					</View>

					<View
						style={[
							styles.statCard,
							{ backgroundColor: Colors[theme].card },
						]}
					>
						<Text
							style={[styles.statNumber, { color: Colors[theme].text }]}
						>
							0
						</Text>
						<Text
							style={[
								styles.statLabel,
								{ color: Colors[theme].secondary },
							]}
						>
							Following
						</Text>
					</View>

					<View
						style={[
							styles.statCard,
							{ backgroundColor: Colors[theme].card },
						]}
					>
						<Text
							style={[styles.statNumber, { color: Colors[theme].text }]}
						>
							0
						</Text>
						<Text
							style={[
								styles.statLabel,
								{ color: Colors[theme].secondary },
							]}
						>
							Posts
						</Text>
					</View>
				</View>

				{/* <Pressable style={styles.followButtonContainer}>
					<GlassView
						tintColor={Colors.accent}
						style={styles.followButton}
						isInteractive
					>
						<Text style={styles.followButtonText}>Follow</Text>
					</GlassView>
				</Pressable> */}

				<View style={styles.postSection}>
					<Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
						Posts
					</Text>
					{posts.map((post) => (
						<PostContainer
							key={post.id}
							href={{ uri: post.image }}
							time={post.created_at}
							author={post.author}
							pfp={{ uri: post.pfp }}
							caption={post.caption}
						/>
					))}
				</View>
			</ScrollView>
		</View>
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
		zIndex: 16,
		top: 60,
	},
	editButton: {
		position: "absolute",
		left: 16,
		zIndex: 16,
		top: 60,
	},

	glassButton: {
		width: 50,
		height: 50,
		borderRadius: 50,
		justifyContent: "center",
		alignItems: "center",
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
	},

	displayName: {
		fontSize: 26,
		fontWeight: "700",
	},

	username: {
		fontSize: 16,
		marginTop: 3,
	},

	bio: {
		fontSize: 15,
		textAlign: "center",
		marginTop: 14,
		maxWidth: 300,
		lineHeight: 21,
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

	section: {
		marginTop: 32,
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

	emptyPosts: {
		minHeight: 220,
		borderRadius: 22,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},

	emptyTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginTop: 12,
	},

	emptyDescription: {
		fontSize: 14,
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
