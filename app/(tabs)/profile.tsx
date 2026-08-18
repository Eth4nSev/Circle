import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
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
	const colors = Colors[theme];

	useEffect(() => {
		async function getPosts() {
			const { data, error } = await supabase.from("posts").select("*");

			if (error) {
				console.error("Error fetching posts:", error);
				return;
			}

			setPosts(data);
		}

		getPosts();
	}, []);

	return (
		<View
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior="automatic"
			>
				<Pressable
					onPress={() => router.push("/(tabs)/settings")}
					style={styles.settingsButton}
				>
					<GlassView isInteractive style={styles.glassButton}>
						<MaterialIcons
							name="settings"
							size={24}
							color={colors.text}
						/>
					</GlassView>
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

				<View style={styles.profileHeader}>
					<View style={styles.profilePicture}>
						<MaterialIcons
							name="person"
							size={58}
							color={colors.text}
						/>
					</View>

					<Text style={[styles.displayName, { color: colors.text }]}>
						Display Name
					</Text>

					<Text
						style={[styles.username, { color: colors.secondary }]}
					>
						@username
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
							style={[styles.statNumber, { color: colors.text }]}
						>
							0
						</Text>
						<Text
							style={[
								styles.statLabel,
								{ color: colors.secondary },
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
							style={[styles.statNumber, { color: colors.text }]}
						>
							0
						</Text>
						<Text
							style={[
								styles.statLabel,
								{ color: colors.secondary },
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
							style={[styles.statNumber, { color: colors.text }]}
						>
							0
						</Text>
						<Text
							style={[
								styles.statLabel,
								{ color: colors.secondary },
							]}
						>
							Posts
						</Text>
					</View>
				</View>

				<Pressable style={styles.followButtonContainer}>
					<GlassView
						tintColor={Colors.accent}
						style={styles.followButton}
						isInteractive
					>
						<Text style={styles.followButtonText}>Follow</Text>
					</GlassView>
				</Pressable>

				<View style={styles.postSection}>
					<Text style={[styles.sectionTitle, { color: colors.text }]}>
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
	},
	editButton: {
		position: "absolute",
		left: 16,
		zIndex: 16,
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
