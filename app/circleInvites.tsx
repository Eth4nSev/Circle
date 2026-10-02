import SupabaseImage from "@/components/SupabaseImage";
import { supabase } from "@/app/utils/supabase";
import Back from "@/components/Back";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	useColorScheme,
	View,
} from "react-native";
import { useAccent } from "./context/accent";
import { sendNotification } from "./utils/notifications";

type Friend = {
	id: string;
	username: string | null;
	display_name: string | null;
	avatar_url: string | null;
};

export default function CircleInvites() {
	const { circleId } = useLocalSearchParams<{ circleId: string }>();

	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];
	const { accent } = useAccent();

	const [circleName, setCircleName] = useState("Circle");
	const [friends, setFriends] = useState<Friend[]>([]);
	const [selected, setSelected] = useState<string[]>([]);
	const [loading, setLoading] = useState(true);
	const [inviting, setInviting] = useState(false);

	useEffect(() => {
		loadInvitees();
	}, [circleId]);

	async function loadInvitees() {
		if (!circleId) return;

		setLoading(true);

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			router.replace("/login");
			return;
		}

		const [{ data: circle }, { data: memberRows, error: memberError }] =
			await Promise.all([
				supabase
					.from("circles")
					.select("name")
					.eq("id", circleId)
					.single(),

				supabase
					.from("circle_members")
					.select("user_id")
					.eq("circle_id", circleId),
			]);

		if (circle) {
			setCircleName(circle.name);
		}

		if (memberError) {
			console.error("Error loading Circle members:", memberError);

			Alert.alert("Error", "Circle members could not be loaded.");

			setLoading(false);
			return;
		}

		const memberIds = new Set((memberRows ?? []).map((row) => row.user_id));

		const { data: following, error: followingError } = await supabase
			.from("follows")
			.select("following_id")
			.eq("follower_id", user.id)
			.eq("status", "accepted");

		if (followingError) {
			console.error("Error loading following:", followingError);

			setFriends([]);
			setLoading(false);
			return;
		}

		const { data: followers, error: followersError } = await supabase
			.from("follows")
			.select("follower_id")
			.eq("following_id", user.id)
			.eq("status", "accepted");

		if (followersError) {
			console.error("Error loading followers:", followersError);

			setFriends([]);
			setLoading(false);
			return;
		}

		const followingIds = new Set(
			(following ?? []).map((row) => row.following_id),
		);

		const mutualIds = (followers ?? [])
			.map((row) => row.follower_id)
			.filter(
				(id) =>
					followingIds.has(id) &&
					id !== user.id &&
					!memberIds.has(id),
			);

		if (mutualIds.length === 0) {
			setFriends([]);
			setLoading(false);
			return;
		}

		const { data: profiles, error: profileError } = await supabase
			.from("profiles")
			.select("id, username, display_name, avatar_url")
			.in("id", mutualIds);

		if (profileError) {
			console.error("Error loading friends:", profileError);

			Alert.alert("Error", "Friends could not be loaded.");

			setFriends([]);
			setLoading(false);
			return;
		}

		setFriends(profiles ?? []);
		setLoading(false);
	}

	function toggleSelected(id: string) {
		setSelected((current) =>
			current.includes(id)
				? current.filter((item) => item !== id)
				: [...current, id],
		);
	}

	async function sendInvites() {
		if (!circleId || selected.length === 0 || inviting) {
			return;
		}

		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) return;

		setInviting(true);

		const invitations = selected.map((inviteeId) => ({
			circle_id: circleId,
			inviter_id: user.id,
			invitee_id: inviteeId,
			status: "pending",
		}));

		const { data: createdInvitations, error } = await supabase
			.from("circle_invitations")
			.insert(invitations)
			.select("id, invitee_id");

		if (error) {
			console.error("Error sending Circle invites:", error);

			Alert.alert("Invite Failed", error.message);

			setInviting(false);
			return;
		}

		for (const invitation of createdInvitations ?? []) {
			await sendNotification({
				recipientId: invitation.invitee_id,
				type: "circle_invite",
				data: {
					invitationId: invitation.id,
					inviterId: user.id,
				},
			});
		}

		Alert.alert(
			"Invites Sent",
			`Invited ${invitations.length} ${
				invitations.length === 1 ? "person" : "people"
			} to ${circleName}.`,
			[
				{
					text: "Done",
					onPress: () => router.back(),
				},
			],
		);

		setInviting(false);
	}

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: false,
				}}
			/>

			<View
				style={[
					styles.container,
					{
						backgroundColor: colors.background,
					},
				]}
			>
				<Back />

				<Text
					style={[
						styles.title,
						{
							color: colors.text,
						},
					]}
				>
					Invite to {circleName}
				</Text>

				<ScrollView
					contentInsetAdjustmentBehavior="automatic"
					contentContainerStyle={styles.content}
					showsVerticalScrollIndicator={false}
				>
					<Text
						style={[
							styles.subtitle,
							{
								color: colors.secondary,
							},
						]}
					>
						Invite mutual friends to join this Circle.
					</Text>

					<GlassView
						style={[
							styles.list,
							{
								backgroundColor: colors.clear,
								borderColor: colors.separator,
							},
						]}
					>
						{loading ? (
							<View style={styles.emptyState}>
								<ActivityIndicator color={accent} />
							</View>
						) : friends.length === 0 ? (
							<View style={styles.emptyState}>
								<Ionicons
									name="people-outline"
									size={30}
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
									No friends to invite
								</Text>

								<Text
									style={[
										styles.emptyText,
										{
											color: colors.secondary,
										},
									]}
								>
									Mutual friends who are not already members
									will appear here.
								</Text>
							</View>
						) : (
							friends.map((friend, index) => {
								const isSelected = selected.includes(friend.id);

								const displayName =
									friend.display_name ||
									friend.username ||
									"Circle member";

								return (
									<Pressable
										key={friend.id}
										onPress={() =>
											toggleSelected(friend.id)
										}
										style={[
											styles.row,
											index < friends.length - 1 && {
												borderBottomWidth:
													StyleSheet.hairlineWidth,
												borderBottomColor:
													colors.separator,
											},
										]}
									>
										{friend.avatar_url ? (
											<SupabaseImage
												source={{
													uri: friend.avatar_url,
												}}
												style={styles.avatar}
											/>
										) : (
											<View
												style={[
													styles.avatar,
													{
														backgroundColor: accent,
													},
												]}
											>
												<Text style={styles.avatarText}>
													{displayName
														.charAt(0)
														.toUpperCase()}
												</Text>
											</View>
										)}

										<View style={styles.info}>
											<Text
												style={[
													styles.name,
													{
														color: colors.text,
													},
												]}
												numberOfLines={1}
											>
												{displayName}
											</Text>

											{friend.username &&
											friend.display_name ? (
												<Text
													style={[
														styles.username,
														{
															color: colors.secondary,
														},
													]}
												>
													@{friend.username}
												</Text>
											) : null}
										</View>

										<View
											style={[
												styles.selection,
												{
													borderColor: isSelected
														? accent
														: colors.separator,
													backgroundColor: isSelected
														? accent
														: "transparent",
												},
											]}
										>
											{isSelected ? (
												<Ionicons
													name="checkmark"
													size={16}
													color="#fff"
												/>
											) : null}
										</View>
									</Pressable>
								);
							})
						)}
					</GlassView>

					{!loading && friends.length > 0 ? (
						<Pressable
							onPress={sendInvites}
							disabled={selected.length === 0 || inviting}
							style={{
								opacity:
									selected.length > 0 && !inviting ? 1 : 0.45,
							}}
						>
							<GlassView
								tintColor={accent}
								isInteractive
								style={styles.sendButton}
							>
								{inviting ? (
									<ActivityIndicator color="#fff" />
								) : (
									<>
										<Ionicons
											name="person-add-outline"
											size={19}
											color="#fff"
										/>

										<Text style={styles.sendText}>
											Invite {selected.length}{" "}
											{selected.length === 1
												? "Person"
												: "People"}
										</Text>
									</>
								)}
							</GlassView>
						</Pressable>
					) : null}
				</ScrollView>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},

	title: {
		position: "absolute",
		top: 72,
		left: 80,
		right: 80,
		textAlign: "center",
		fontSize: 18,
		fontWeight: "700",
		zIndex: 10,
	},

	content: {
		paddingHorizontal: 16,
		paddingTop: 60,
		paddingBottom: 30,
	},

	subtitle: {
		fontSize: 14,
		marginBottom: 12,
	},

	list: {
		borderRadius: 20,
		borderWidth: StyleSheet.hairlineWidth,
		overflow: "hidden",
		marginBottom: 16,
	},

	row: {
		minHeight: 68,
		paddingHorizontal: 14,
		flexDirection: "row",
		alignItems: "center",
	},

	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
		overflow: "hidden",
	},

	avatarText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "700",
	},

	info: {
		flex: 1,
		paddingRight: 10,
	},

	name: {
		fontSize: 15,
		fontWeight: "600",
	},

	username: {
		fontSize: 12,
		marginTop: 2,
	},

	selection: {
		width: 24,
		height: 24,
		borderRadius: 12,
		borderWidth: 1.5,
		alignItems: "center",
		justifyContent: "center",
	},

	emptyState: {
		minHeight: 150,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
		gap: 7,
	},

	emptyTitle: {
		fontSize: 15,
		fontWeight: "600",
		marginTop: 3,
	},

	emptyText: {
		fontSize: 12,
		lineHeight: 17,
		textAlign: "center",
		maxWidth: 290,
	},

	sendButton: {
		height: 52,
		borderRadius: 26,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},

	sendText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
});
