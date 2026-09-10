import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";

type Message = {
	id: string;
	sender_id: string;
	receiver_id: string;
	content: string;
	created_at: string;
};

type Profile = {
	id: string;
	username: string | null;
	display_name: string | null;
	avatar_url: string | null;
};

export default function DM() {
	const { userId } = useLocalSearchParams<{ userId: string }>();
	const router = useRouter();
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];

	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [profile, setProfile] = useState<Profile | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [message, setMessage] = useState("");
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);

	useEffect(() => {
		const loadChat = async () => {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user || !userId) {
				setLoading(false);
				return;
			}

			setCurrentUserId(user.id);

			const { data: profileData } = await supabase
				.from("profiles")
				.select("id, username, display_name, avatar_url")
				.eq("id", userId)
				.single();

			if (profileData) {
				setProfile(profileData);
			}

			const { data: messageData } = await supabase
				.from("direct_messages")
				.select("*")
				.or(
					`and(sender_id.eq.${user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${user.id})`,
				)
				.order("created_at", {
					ascending: true,
				});

			if (messageData) {
				setMessages(messageData);
			}

			setLoading(false);
		};

		loadChat();
	}, [userId]);

	useEffect(() => {
		if (!currentUserId || !userId) return;

		const channel = supabase
			.channel(`dm-${currentUserId}-${userId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "direct_messages",
				},
				(payload) => {
					const newMessage = payload.new as Message;

					const belongsToChat =
						(newMessage.sender_id === currentUserId &&
							newMessage.receiver_id === userId) ||
						(newMessage.sender_id === userId &&
							newMessage.receiver_id === currentUserId);

					if (belongsToChat) {
						setMessages((current) => [...current, newMessage]);
					}
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [currentUserId, userId]);

	const sendMessage = async () => {
		const content = message.trim();

		if (!content || !currentUserId || !userId || sending) {
			return;
		}

		setSending(true);
		setMessage("");

		const { error } = await supabase.from("direct_messages").insert({
			sender_id: currentUserId,
			receiver_id: userId,
			content,
		});

		if (error) {
			setMessage(content);
		}

		setSending(false);
	};

	const displayName =
		profile?.display_name || profile?.username || "Circle member";

	if (loading) {
		return (
			<View
				style={[
					styles.loading,
					{
						backgroundColor: colors.background,
					},
				]}
			>
				<ActivityIndicator />
			</View>
		);
	}

	return (
		<>
			<Stack.Screen
				options={{
					headerShown: true,
					headerTitle: "",
					headerBackTitle: "Back",
					headerStyle: {
						backgroundColor: colors.background,
					},
					headerTintColor: colors.text,
					headerLeft: () => (
						<Pressable
							style={styles.headerLeft}
							onPress={() => router.push(`/profile/${userId}`)}
						>
							<View style={styles.avatar}>
								{profile?.avatar_url ? (
									<View
										style={[
											styles.avatarImage,
											{
												backgroundColor:
													colors.separator,
											},
										]}
									/>
								) : (
									<Ionicons
										name="person"
										size={20}
										color={colors.secondary}
									/>
								)}
							</View>

							<View>
								<Text
									style={[
										styles.headerName,
										{
											color: colors.text,
										},
									]}
									numberOfLines={1}
								>
									{displayName}
								</Text>

								{profile?.username ? (
									<Text
										style={[
											styles.headerUsername,
											{
												color: colors.secondary,
											},
										]}
										numberOfLines={1}
									>
										@{profile.username}
									</Text>
								) : null}
							</View>
						</Pressable>
					),
					headerRight: () => (
						<Pressable>
							<GlassView
								isInteractive
								style={styles.moreButton}
								tintColor={colors.separator}
							>
								<Ionicons
									name="ellipsis-horizontal"
									size={22}
									color={colors.text}
								/>
							</GlassView>
						</Pressable>
					),
				}}
			/>

			<KeyboardAvoidingView
				style={[
					styles.container,
					{
						backgroundColor: colors.background,
					},
				]}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
				keyboardVerticalOffset={90}
			>
				<FlatList
					data={messages}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.messages}
					renderItem={({ item }) => {
						const isMine = item.sender_id === currentUserId;

						return (
							<View
								style={[
									styles.messageRow,
									isMine && styles.messageRowMine,
								]}
							>
								<View
									style={[
										styles.messageBubble,
										{
											backgroundColor: isMine
												? Colors.accent
												: colors.card,
										},
									]}
								>
									<Text
										style={[
											styles.messageText,
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
							</View>
						);
					}}
					ListEmptyComponent={
						<View style={styles.empty}>
							<Ionicons
								name="chatbubble-outline"
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
								Start a conversation
							</Text>

							<Text
								style={[
									styles.emptyText,
									{
										color: colors.secondary,
									},
								]}
							>
								Send a message to {displayName}.
							</Text>
						</View>
					}
				/>

				<View
					style={[
						styles.inputContainer,
						{
							borderTopColor: colors.separator,
							backgroundColor: colors.background,
						},
					]}
				>
					<GlassView
						style={styles.inputGlass}
						tintColor={colors.separator}
					>
						<TextInput
							value={message}
							onChangeText={setMessage}
							placeholder="Message"
							placeholderTextColor={colors.secondary}
							style={[
								styles.input,
								{
									color: colors.text,
								},
							]}
							multiline
							maxLength={2000}
							editable={!sending}
						/>

						<Pressable
							onPress={sendMessage}
							disabled={!message.trim() || sending}
							style={[
								styles.sendButton,
								{
									opacity:
										message.trim() && !sending ? 1 : 0.35,
								},
							]}
						>
							<Ionicons
								name="arrow-up-circle"
								size={34}
								color={Colors.accent}
							/>
						</Pressable>
					</GlassView>
				</View>
			</KeyboardAvoidingView>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	headerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		maxWidth: 230,
	},
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	avatarImage: {
		width: "100%",
		height: "100%",
	},
	headerName: {
		fontSize: 16,
		fontWeight: "600",
	},
	headerUsername: {
		fontSize: 12,
		marginTop: 1,
	},
	moreButton: {
		width: 38,
		height: 38,
		borderRadius: 19,
		alignItems: "center",
		justifyContent: "center",
	},
	messages: {
		padding: 16,
		paddingBottom: 20,
		flexGrow: 1,
	},
	messageRow: {
		width: "100%",
		alignItems: "flex-start",
		marginBottom: 8,
	},
	messageRowMine: {
		alignItems: "flex-end",
	},
	messageBubble: {
		maxWidth: "78%",
		paddingHorizontal: 14,
		paddingVertical: 9,
		borderRadius: 18,
	},
	messageText: {
		fontSize: 16,
		lineHeight: 21,
	},
	empty: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: 80,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "600",
		marginTop: 12,
	},
	emptyText: {
		fontSize: 14,
		marginTop: 5,
	},
	inputContainer: {
		paddingHorizontal: 12,
		paddingTop: 8,
		paddingBottom: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	inputGlass: {
		minHeight: 48,
		maxHeight: 130,
		borderRadius: 24,
		paddingLeft: 16,
		paddingRight: 6,
		flexDirection: "row",
		alignItems: "flex-end",
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
