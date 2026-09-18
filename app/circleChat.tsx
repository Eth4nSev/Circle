import { supabase } from "@/app/utils/supabase";
import Back from "@/components/Back";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import { useAccent } from "./context/accent";

type Circle = { id: string; name: string; color: string; chat_enabled: boolean };
type Message = { id: string; circle_id: string; sender_id: string; content: string; created_at: string };
type Profile = { id: string; display_name: string | null; username: string | null };

export default function CircleChat() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const { accent } = useAccent();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [circle, setCircle] = useState<Circle | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadChat = async () => {
    if (!circleId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const [{ data: circleData }, { data: messageData }] = await Promise.all([
      supabase.from("circles").select("id, name, color, chat_enabled").eq("id", circleId).single(),
      supabase.from("circle_messages").select("*").eq("circle_id", circleId).order("created_at", { ascending: true }),
    ]);

    setCircle(circleData ?? null);
    const loaded = messageData ?? [];
    setMessages(loaded);

    const senderIds = [...new Set(loaded.map((item) => item.sender_id))];
    if (senderIds.length) {
      const { data: profileData } = await supabase.from("profiles").select("id, display_name, username").in("id", senderIds);
      const nextProfiles: Record<string, Profile> = {};
      for (const profile of profileData ?? []) nextProfiles[profile.id] = profile;
      setProfiles(nextProfiles);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadChat();
  }, [circleId]);

  useEffect(() => {
    if (!circleId || !currentUserId) return;
    const channel = supabase
      .channel(`circle-chat-${circleId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "circle_messages", filter: `circle_id=eq.${circleId}` },
        (payload) => {
          const next = payload.new as Message;
          setMessages((current) => current.some((item) => item.id === next.id) ? current : [...current, next]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId, currentUserId]);

  const sendMessage = async () => {
    const content = message.trim();
    if (!content || !currentUserId || !circleId || sending || !circle?.chat_enabled) return;
    setSending(true);
    setMessage("");
    const { error } = await supabase.from("circle_messages").insert({
      circle_id: circleId,
      sender_id: currentUserId,
      content,
    });
    if (error) {
      console.error("Error sending Circle message:", error);
      setMessage(content);
    }
    setSending(false);
  };

  const displayName = (senderId: string) => {
    const profile = profiles[senderId];
    return profile?.display_name || profile?.username || "Circle member";
  };

  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator /></View>;

  if (!circle) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={44} color={colors.secondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Circle not found</Text>
      </View>
    );
  }

  return (
    <>
      <Back />
      <View style={styles.header}>
        <View style={[styles.headerCircle, { backgroundColor: circle.color }]}>
          <Text style={styles.headerCircleText}>{circle.name.trim().charAt(0).toUpperCase() || "C"}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>{circle.name}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondary }]}>Circle Chat</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item, index }) => {
            const isMine = item.sender_id === currentUserId;
            const previous = messages[index - 1];
            const showTimestamp = !previous || new Date(item.created_at).getTime() - new Date(previous.created_at).getTime() > 60 * 60 * 1000;
            const showSender = !isMine && (!previous || previous.sender_id !== item.sender_id);
            return (
              <View>
                {showTimestamp ? <Text style={[styles.messageTimestamp, { color: colors.secondary }]}>{new Date(item.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</Text> : null}
                {showSender ? <Text style={[styles.senderName, { color: colors.secondary }]}>{displayName(item.sender_id)}</Text> : null}
                <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                  <View style={[styles.messageBubble, { backgroundColor: isMine ? accent : colors.card }]}>
                    <Text style={[styles.messageText, { color: isMine ? "#fff" : colors.text }]}>{item.content}</Text>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-outline" size={42} color={colors.secondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Start a conversation</Text>
              <Text style={[styles.emptyText, { color: colors.secondary }]}>Send the first message to {circle.name}.</Text>
            </View>
          }
        />

        {circle.chat_enabled ? (
          <View style={styles.inputContainer}>
            <GlassView style={styles.inputGlass} isInteractive>
              <TextInput value={message} onChangeText={setMessage} placeholder="Message" placeholderTextColor={colors.secondary} style={[styles.input, { color: colors.text }]} maxLength={2000} editable={!sending} />
              <Pressable onPress={sendMessage} disabled={!message.trim() || sending} style={[styles.sendButton, { opacity: message.trim() && !sending ? 1 : 0.35 }]}>
                <Ionicons name="arrow-up-circle" size={34} color={accent} />
              </Pressable>
            </GlassView>
          </View>
        ) : (
          <View style={styles.disabledContainer}>
            <GlassView style={styles.disabledGlass}>
              <Ionicons name="lock-closed-outline" size={19} color={colors.secondary} />
              <Text style={[styles.disabledText, { color: colors.secondary }]}>Circle Chat is disabled by an administrator.</Text>
            </GlassView>
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  header: { position: "absolute", top: 60, left: "50%", transform: [{ translateX: -90 }], flexDirection: "row", alignItems: "center", gap: 9, width: 180, zIndex: 60 },
  headerCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerCircleText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "600" },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  messages: { padding: 16, paddingTop: 125, paddingBottom: 20, flexGrow: 1, justifyContent: "flex-end" },
  messageRow: { width: "100%", alignItems: "flex-start", marginBottom: 8 },
  messageRowMine: { alignItems: "flex-end" },
  messageBubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  messageText: { fontSize: 16, lineHeight: 21 },
  messageTimestamp: { fontSize: 12, textAlign: "center", marginTop: 8, marginBottom: 8 },
  senderName: { fontSize: 12, marginLeft: 4, marginBottom: 4 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  emptyText: { fontSize: 14, marginTop: 5 },
  inputContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  inputGlass: { minHeight: 48, maxHeight: 130, borderRadius: 24, paddingLeft: 16, paddingRight: 6, flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
  input: { flex: 1, fontSize: 16, paddingTop: 12, paddingBottom: 12, maxHeight: 110 },
  sendButton: { width: 40, height: 46, alignItems: "center", justifyContent: "center" },
  disabledContainer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  disabledGlass: { minHeight: 48, borderRadius: 24, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  disabledText: { fontSize: 13 },
});
