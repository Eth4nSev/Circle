import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Button, ContextMenu, Host, RNHostView } from "@expo/ui/swift-ui";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	useColorScheme,
	View,
} from "react-native";
import { useAccent } from "./context/accent";

type CommentProfile = {
	username: string;
	display_name: string;
	avatar_url: string | null;
};

type Comment = {
	id: string;
	post_id: string;
	user_id: string;
	content: string;
	created_at: string;
	profiles?: CommentProfile | null;
};

export default function Comments() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];
	const { accent } = useAccent();

	const { postId } = useLocalSearchParams<{ postId: string }>();

	const [comments, setComments] = useState<Comment[]>([]);
	const [comment, setComment] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [userId, setUserId] = useState<string | null>(null);

	useEffect(() => {
		if (!postId) return;

		loadComments();
		getUser();
	}, [postId]);

	async function getUser() {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		setUserId(user?.id ?? null);
	}

	async function loadComments() {
		setLoading(true);

		const { data, error } = await supabase
			.from("comments")
			.select("id, post_id, user_id, content, created_at")
			.eq("post_id", postId)
			.order("created_at", { ascending: true });

		if (error) {
			console.error("Error fetching comments:", error);
			setLoading(false);
			return;
		}

		const commentsWithProfiles = await Promise.all(
			(data ?? []).map(async (item) => {
				const { data: profile } = await supabase
					.from("profiles")
					.select("username, display_name, avatar_url")
					.eq("id", item.user_id)
					.single();

				return {
					...item,
					profiles: profile ?? null,
				};
			}),
		);

		setComments(commentsWithProfiles as Comment[]);
		setLoading(false);
	}

	async function addComment() {
		const content = comment.trim();

		if (!content || !userId || !postId || sending) return;

		setSending(true);

		const { data, error } = await supabase
			.from("comments")
			.insert({
				post_id: postId,
				user_id: userId,
				content,
			})
			.select("id, post_id, user_id, content, created_at")
			.single();

		if (error) {
			console.error("Error adding comment:", error);
			setSending(false);
			return;
		}

		if (data) {
			const { data: profile } = await supabase
				.from("profiles")
				.select("username, display_name, avatar_url")
				.eq("id", data.user_id)
				.single();

			const newComment: Comment = {
				id: data.id,
				post_id: data.post_id,
				user_id: data.user_id,
				content: data.content,
				created_at: data.created_at,
				profiles: profile ?? null,
			};

			setComments((current) => [...current, newComment]);
		}

		setComment("");
		setSending(false);
	}

	async function deleteComment(id: string) {
		if (!userId) return;

		const { error } = await supabase
			.from("comments")
			.delete()
			.eq("id", id)
			.eq("user_id", userId);

		if (error) {
			console.error("Error deleting comment:", error);
			return;
		}

		setComments((current) => current.filter((item) => item.id !== id));
	}

	const openProfile = () => {
		router.back();

		setTimeout(() => {
			if (userId === userId) {
				router.push("/(tabs)/profile");
			} else {
				router.push({
					pathname: "/profiles",
					params: {
						id: userId,
					},
				});
			}
		}, 300);
	};

	function renderComment({ item, index }: { item: Comment; index: number }) {
		const isMine = item.user_id === userId;

		const displayName =
			item.profiles?.display_name || item.profiles?.username || "User";

		const username = item.profiles?.username || "user";

		const previousComment = comments[index - 1];

		const showTimestamp =
			!previousComment ||
			new Date(item.created_at).getTime() -
				new Date(previousComment.created_at).getTime() >
				60 * 60 * 1000;

		return (
			<View>
				{showTimestamp ? (
					<Text
						style={[
							styles.messageTimestamp,
							{ color: colors.secondary },
						]}
					>
						{new Date(item.created_at).toLocaleString([], {
							month: "short",
							day: "numeric",
							hour: "numeric",
							minute: "2-digit",
						})}
					</Text>
				) : null}

				<View
					style={[styles.commentRow, isMine && styles.commentRowMine]}
				>
					{!isMine && (
						<View
							style={[
								styles.avatar,
								{
									backgroundColor: colors.clear,
									borderColor: colors.separator,
								},
							]}
						>
							{item.profiles?.avatar_url ? (
								<Image
									source={{ uri: item.profiles.avatar_url }}
									style={styles.avatarImage}
								/>
							) : (
								<Text
									style={[
										styles.avatarText,
										{ color: colors.text },
									]}
								>
									{displayName.charAt(0).toUpperCase()}
								</Text>
							)}
						</View>
					)}

					<View
						style={[
							styles.commentContent,
							isMine && styles.commentContentMine,
						]}
					>
						<View
							style={[
								styles.nameRow,
								isMine && styles.nameRowMine,
							]}
						>
							<Text
								style={[
									styles.displayName,
									{ color: colors.text },
								]}
								numberOfLines={1}
							>
								{displayName}
							</Text>

							<Text
								style={[
									styles.username,
									{ color: colors.secondary },
								]}
								numberOfLines={1}
							>
								@{username}
							</Text>
						</View>

						<Host>
							<ContextMenu>
								<ContextMenu.Items>
									<Button
										systemImage="person"
										label="Go to Profile"
										onPress={openProfile}
									/>
									{isMine && (
										<Button
											systemImage="trash"
											label="Delete"
											role="destructive"
											onPress={() =>
												deleteComment(item.id)
											}
										/>
									)}
								</ContextMenu.Items>

								<ContextMenu.Trigger>
									<RNHostView matchContents>
										<View
											style={[
												styles.commentBubble,
												{
													backgroundColor: isMine
														? accent
														: colors.card,
												},
											]}
										>
											<Text
												style={[
													styles.commentText,
													{
														color: isMine
															? "#fff"
															: colors.text,
													},
												]}
											>
												{item.content}
											</Text>
										</View>
									</RNHostView>
								</ContextMenu.Trigger>
							</ContextMenu>
						</Host>
					</View>
				</View>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
		>
			<View style={styles.header}>
				<Text style={[styles.title, { color: colors.text }]}>
					Comments
				</Text>

				<GlassView
					style={{
						width: 50,
						height: 50,
						borderRadius: 50,
						justifyContent: "center",
						alignItems: "center",
					}}
					isInteractive
				>
					<Pressable onPress={() => router.back()}>
						<MaterialIcons
							name="close"
							size={28}
							color={colors.text}
						/>
					</Pressable>
				</GlassView>
			</View>

			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator color={accent} />
				</View>
			) : comments.length === 0 ? (
				<View style={styles.center}>
					<View style={styles.emptyIcon}>
						<Ionicons
							name="chatbubble-outline"
							size={28}
							color={accent}
						/>
					</View>

					<Text style={[styles.emptyTitle, { color: colors.text }]}>
						No comments yet
					</Text>

					<Text
						style={[
							styles.emptySubtitle,
							{ color: colors.secondary },
						]}
					>
						Be the first to comment.
					</Text>
				</View>
			) : (
				<FlatList
					data={comments}
					keyExtractor={(item) => item.id}
					renderItem={renderComment}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				/>
			)}

			<View style={styles.inputArea}>
				<GlassView style={styles.inputGlass}>
					<TextInput
						value={comment}
						onChangeText={setComment}
						placeholder="Comment"
						placeholderTextColor={colors.secondary}
						multiline
						maxLength={500}
						editable={!sending}
						style={[styles.input, { color: colors.text }]}
					/>

					<Pressable
						onPress={addComment}
						disabled={!comment.trim() || sending}
						style={[
							styles.sendButton,
							{
								opacity: comment.trim() && !sending ? 1 : 0.35,
							},
						]}
					>
						{sending ? (
							<ActivityIndicator color={accent} size="small" />
						) : (
							<Ionicons
								name="arrow-up-circle"
								size={34}
								color={accent}
							/>
						)}
					</Pressable>
				</GlassView>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 20,
		paddingHorizontal: 20,
	},

	header: {
		height: 58,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	title: {
		fontSize: 28,
		fontWeight: "700",
	},

	list: {
		paddingHorizontal: 16,
		paddingTop: 8,
		paddingBottom: 16,
		gap: 4,
		flexGrow: 1,
		justifyContent: "flex-end",
	},

	commentRow: {
		width: "100%",
		flexDirection: "row",
		alignItems: "flex-end",
		marginBottom: 10,
		gap: 8,
	},

	commentRowMine: {
		justifyContent: "flex-end",
	},

	avatar: {
		width: 30,
		height: 30,
		borderRadius: 15,
		borderWidth: 1,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
		marginBottom: 2,
	},

	avatarImage: {
		width: "100%",
		height: "100%",
	},

	avatarText: {
		fontSize: 13,
		fontWeight: "600",
	},

	commentContent: {
		maxWidth: "78%",
		alignItems: "flex-start",
	},

	commentContentMine: {
		alignItems: "flex-end",
	},

	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 4,
		paddingHorizontal: 4,
	},

	nameRowMine: {
		justifyContent: "flex-end",
	},

	displayName: {
		fontSize: 13,
		fontWeight: "600",
	},

	username: {
		fontSize: 12,
	},

	commentBubble: {
		paddingHorizontal: 14,
		paddingVertical: 9,
		borderRadius: 18,
	},

	commentText: {
		fontSize: 16,
		lineHeight: 21,
	},

	deleteButton: {
		marginTop: 4,
		paddingHorizontal: 4,
	},

	messageTimestamp: {
		fontSize: 12,
		textAlign: "center",
		marginTop: 8,
		marginBottom: 8,
	},

	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingBottom: 50,
		paddingHorizontal: 30,
	},

	emptyIcon: {
		width: 58,
		height: 58,
		borderRadius: 29,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 14,
	},

	emptyTitle: {
		fontSize: 18,
		fontWeight: "600",
	},

	emptySubtitle: {
		fontSize: 14,
		marginTop: 5,
	},

	inputArea: {
		paddingHorizontal: 12,
		paddingTop: 8,
		paddingBottom: 28,
	},

	inputGlass: {
		minHeight: 48,
		maxHeight: 130,
		borderRadius: 24,
		paddingLeft: 16,
		paddingRight: 6,
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "center",
	},

	input: {
		flex: 1,
		fontSize: 16,
		paddingTop: 12,
		paddingBottom: 12,
		maxHeight: 110,
	},

	sendButton: {
		width: 40,
		height: 46,
		alignItems: "center",
		justifyContent: "center",
	},
});
