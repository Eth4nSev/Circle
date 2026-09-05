import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
      .select(
        `
        id,
        post_id,
        user_id,
        content,
        created_at,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      setLoading(false);
      return;
    }

    setComments((data as Comment[]) ?? []);
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
      .select(
        `
        id,
        post_id,
        user_id,
        content,
        created_at,
        profiles (
          username,
          display_name,
          avatar_url
        )
      `,
      )
      .single();

    if (error) {
      console.error("Error adding comment:", error);
      setSending(false);
      return;
    }

    if (data) {
      const profile = Array.isArray(data.profiles)
        ? (data.profiles[0] ?? null)
        : (data.profiles ?? null);

      const newComment: Comment = {
        id: data.id,
        post_id: data.post_id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        profiles: profile as CommentProfile | null,
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

  function renderComment({ item }: { item: Comment }) {
    const isOwner = item.user_id === userId;

    const displayName =
      item.profiles?.display_name || item.profiles?.username || "User";

    const username = item.profiles?.username || "user";

    return (
      <View style={styles.comment}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.card,
              borderColor: colors.separator,
            },
          ]}
        >
          {item.profiles?.avatar_url ? (
            <View style={styles.avatarImageContainer}>
              <View style={styles.avatarImage}>
                <Text style={[styles.avatarText, { color: colors.text }]}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        <View style={styles.commentBody}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, { color: colors.text }]}>
              {displayName}
            </Text>

            <Text style={[styles.username, { color: colors.secondary }]}>
              @{username}
            </Text>
          </View>

          <Text style={[styles.commentText, { color: colors.text }]}>
            {item.content}
          </Text>

          <Text style={[styles.date, { color: colors.secondary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        {isOwner && (
          <Pressable onPress={() => deleteComment(item.id)} hitSlop={10}>
            <Ionicons name="trash-outline" size={18} color={colors.secondary} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={20}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text }]}>Comments</Text>

        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.center}>
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
            No comments yet
          </Text>

          <Text
            style={[
              styles.emptySubtitle,
              {
                color: colors.secondary,
              },
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

      <View
        style={[
          styles.inputRow,
          {
            borderTopColor: colors.separator,
          },
        ]}
      >
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Write a comment..."
          placeholderTextColor={colors.secondary}
          multiline
          maxLength={500}
          style={[
            styles.input,
            {
              backgroundColor: colors.card,
              color: colors.text,
            },
          ]}
        />

        <Pressable
          onPress={addComment}
          disabled={!comment.trim() || sending}
          style={[
            styles.sendButton,
            {
              backgroundColor: Colors.accent,
              opacity: !comment.trim() || sending ? 0.4 : 1,
            },
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="arrow-up" size={20} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatDate(date: string) {
  const created = new Date(date);
  const now = new Date();

  const difference = now.getTime() - created.getTime();

  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d`;

  return created.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  list: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  comment: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 15,
    fontWeight: "600",
  },

  commentBody: {
    flex: 1,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  displayName: {
    fontSize: 15,
    fontWeight: "600",
  },

  username: {
    fontSize: 13,
  },

  commentText: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 3,
  },

  date: {
    fontSize: 12,
    marginTop: 5,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },

  emptySubtitle: {
    fontSize: 14,
    marginTop: 5,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 110,
    borderRadius: 21,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
});
