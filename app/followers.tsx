import SupabaseImage from "@/components/SupabaseImage";
import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useAccent } from "./context/accent";

type Profile = {
	id: string;
	avatar_url: string | null;
	display_name: string | null;
	username: string | null;
};

export default function Followers() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];
	const { accent } = useAccent();

	const [followers, setFollowers] = useState<Profile[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadFollowers();
	}, []);

	async function loadFollowers() {
		try {
			setLoading(true);
			setError(null);

			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				throw new Error("You must be signed in to view followers.");
			}

			const { data: followRows, error: followError } = await supabase
				.from("follows")
				.select("follower_id")
				.eq("following_id", user.id)
				.eq("status", "accepted")
				.order("created_at", { ascending: false });

			if (followError) {
				throw followError;
			}

			if (!followRows?.length) {
				setFollowers([]);
				return;
			}

			const followerIds = followRows.map((row) => row.follower_id);

			const { data: profiles, error: profileError } = await supabase
				.from("profiles")
				.select("id, avatar_url, display_name, username")
				.in("id", followerIds);

			if (profileError) {
				throw profileError;
			}

			const profileMap = new Map(
				(profiles ?? []).map((profile) => [profile.id, profile]),
			);

			const orderedFollowers = followerIds
				.map((id) => profileMap.get(id))
				.filter(Boolean) as Profile[];

			setFollowers(orderedFollowers);
		} catch (err) {
			console.error("Error loading followers:", err);
			setError("Unable to load followers.");
		} finally {
			setLoading(false);
		}
	}

	function openProfile(userId: string) {
		router.dismiss();
		setTimeout(() => {
			router.push({
				pathname: "/profiles",
				params: { id: userId },
			});
		}, 100);
	}

	if (loading) {
		return (
			<View
				style={[styles.center, { backgroundColor: colors.background }]}
			>
				<ActivityIndicator />
			</View>
		);
	}

	if (error) {
		return (
			<View
				style={[styles.center, { backgroundColor: colors.background }]}
			>
				<Text style={[styles.message, { color: colors.text }]}>
					{error}
				</Text>

				<Pressable onPress={loadFollowers}>
					<Text style={[styles.retry, { color: accent }]}>
						Try Again
					</Text>
				</Pressable>
			</View>
		);
	}

	return (
		<>
			<View style={[styles.container]}>
				<FlatList
					data={followers}
					keyExtractor={(item) => item.id}
					contentContainerStyle={
						followers.length === 0
							? styles.emptyContainer
							: styles.list
					}
					showsVerticalScrollIndicator={false}
					renderItem={({ item }) => (
						<Pressable
							style={styles.follower}
							onPress={() => openProfile(item.id)}
						>
							{item.avatar_url ? (
								<SupabaseImage
									source={{ uri: item.avatar_url }}
									style={styles.avatar}
								/>
							) : (
								<View
									style={[
										styles.avatar,
										styles.placeholder,
										{ backgroundColor: colors.card },
									]}
								>
									<Ionicons
										name="person"
										size={22}
										color={colors.secondary}
									/>
								</View>
							)}

							<View style={styles.info}>
								<Text
									numberOfLines={1}
									style={[
										styles.displayName,
										{ color: colors.text },
									]}
								>
									{item.display_name ||
										item.username ||
										"User"}
								</Text>

								{item.username && (
									<Text
										numberOfLines={1}
										style={[
											styles.username,
											{ color: colors.secondary },
										]}
									>
										@{item.username}
									</Text>
								)}
							</View>
						</Pressable>
					)}
					ListEmptyComponent={
						<View style={styles.empty}>
							<Ionicons
								name="people-outline"
								size={42}
								color={colors.secondary}
							/>

							<Text
								style={[
									styles.emptyTitle,
									{ color: colors.text },
								]}
							>
								No followers yet
							</Text>

							<Text
								style={[
									styles.emptySubtitle,
									{ color: colors.secondary },
								]}
							>
								When someone follows you, they'll appear here.
							</Text>
						</View>
					}
				/>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 10,
	},
	list: {
		paddingHorizontal: 20,
	},
	follower: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
	},
	avatar: {
		width: 52,
		height: 52,
		borderRadius: 26,
	},
	placeholder: {
		justifyContent: "center",
		alignItems: "center",
	},
	info: {
		flex: 1,
		marginLeft: 14,
	},
	displayName: {
		fontSize: 16,
		fontWeight: "600",
	},
	username: {
		fontSize: 14,
		marginTop: 2,
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	message: {
		fontSize: 15,
		textAlign: "center",
	},
	retry: {
		fontSize: 15,
		fontWeight: "600",
		marginTop: 10,
	},
	emptyContainer: {
		flexGrow: 1,
		justifyContent: "center",
	},
	empty: {
		alignItems: "center",
		paddingHorizontal: 40,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginTop: 12,
	},
	emptySubtitle: {
		fontSize: 14,
		textAlign: "center",
		marginTop: 6,
		lineHeight: 20,
	},
});
