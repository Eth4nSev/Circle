import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import {
  loadNotifications,
  markNotificationRead,
  removeNotification,
  updateNotification,
  type LocalNotification,
} from "./utils/notifications";
import { supabase } from "./utils/supabase";

function formatDate(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationsScreen() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  const [items, setItems] = useState<LocalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const refresh = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    const next = await loadNotifications();
    setItems(next);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function markRead(id: string) {
    const next = await markNotificationRead(id);
    setItems(next);
  }

  async function respondToFollowRequest(
    item: LocalNotification,
    accept: boolean,
  ) {
    const followId = item.data.followId;

    if (typeof followId !== "string") {
      Alert.alert("Request unavailable", "This follow request is no longer available.");
      return;
    }

    setProcessingId(item.id);

    try {
      if (accept) {
        const { error } = await supabase
          .from("follows")
          .update({ status: "accepted" })
          .eq("id", followId)
          .eq("status", "pending");

        if (error) {
          console.error("Failed to approve follow request:", error);
          Alert.alert("Couldn't approve request", "Please try again.");
          return;
        }
      } else {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("id", followId)
          .eq("status", "pending");

        if (error) {
          console.error("Failed to decline follow request:", error);
          Alert.alert("Couldn't decline request", "Please try again.");
          return;
        }
      }

      if (accept) {
        let actorName = actorNameFor(item);
        const actorId = item.data.actorId;

        if (!actorName && typeof actorId === "string") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, username")
            .eq("id", actorId)
            .maybeSingle();

          actorName =
            profile?.display_name?.trim() ||
            profile?.username?.trim() ||
            null;
        }

        const resolvedName = actorName ?? "Someone";
        const next = await updateNotification(item.id, {
          type: "follow",
          title: "New follower",
          body: `${resolvedName} started following you.`,
          data: {
            ...item.data,
            actorName: resolvedName,
          },
          read: true,
        });
        setItems(next);
      } else {
        const next = await removeNotification(item.id);
        setItems(next);
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function openNotification(item: LocalNotification) {
    await markRead(item.id);

    if (item.type === "direct_message") {
      const senderId = item.data.senderId;
      if (typeof senderId === "string") {
        router.push({
          pathname: "/dm",
          params: { userId: senderId },
        });
      }
      return;
    }

    if (item.type === "circle_invite") {
      router.push("/invites");
      return;
    }

    const actorId = item.data.actorId;
    if (typeof actorId === "string") {
      router.push({
        pathname: "/profiles",
        params: { id: actorId },
      });
    }
  }

  function iconFor(item: LocalNotification) {
    switch (item.type) {
      case "direct_message":
        return "chatbubble-outline" as const;
      case "circle_invite":
        return "people-outline" as const;
      case "like":
        return "thumbs-up-outline" as const;
      case "comment":
        return "chatbox-outline" as const;
      case "follow_request":
        return "person-add-outline" as const;
      case "follow":
        return "person-outline" as const;
    }
  }

  function titleFor(item: LocalNotification) {
    switch (item.type) {
      case "direct_message":
        return "New message";
      case "circle_invite":
        return "Circle invitation";
      case "like":
        return "New like";
      case "comment":
        return "New comment";
      case "follow_request":
        return "Follow request";
      case "follow":
        return "New follower";
    }
  }

  function actorNameFor(item: LocalNotification) {
    const value = item.data.actorName;
    return typeof value === "string" && value.trim() ? value.trim() : null;
  }

  function actionTextFor(item: LocalNotification) {
    switch (item.type) {
      case "direct_message":
        return "sent you a message.";
      case "circle_invite":
        return "invited you to a Circle.";
      case "like":
        return "liked your post.";
      case "comment":
        return "commented on your post.";
      case "follow_request":
        return "requested to follow you.";
      case "follow":
        return "started following you.";
    }
  }

  async function openActor(item: LocalNotification) {
    await markRead(item.id);

    const actorId = item.data.actorId;
    if (typeof actorId !== "string") return;

    router.push({
      pathname: "/profiles",
      params: { id: actorId },
    });
  }

  function renderItem({ item }: { item: LocalNotification }) {
    const isFollowRequest = item.type === "follow_request";
    const busy = processingId === item.id;

    return (
      <View
        style={[
          styles.notificationCard,
          {
            backgroundColor: item.read ? colors.card : colors.stats,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: colors.clear,
              },
            ]}
          >
            <Ionicons name={iconFor(item)} size={23} color={colors.text} />
          </View>

          <View style={styles.content}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                {titleFor(item)}
              </Text>

              {!item.read && <View style={styles.unreadDot} />}
            </View>

            <View style={styles.bodyRow}>
              {actorNameFor(item) ? (
                <Pressable onPress={() => openActor(item)} hitSlop={6}>
                  <Text style={[styles.actorName, { color: colors.accent }]}>
                    {actorNameFor(item)}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => openNotification(item)}
                style={styles.actionPressable}
              >
                <Text style={[styles.body, { color: colors.secondary }]}>{actorNameFor(item) ? actionTextFor(item) : item.body}</Text>
              </Pressable>
            </View>

            <Text style={[styles.date, { color: colors.secondary }]}>
              {formatDate(item.receivedAt)}
            </Text>
          </View>
        </View>

        {isFollowRequest ? (
          <View style={styles.actions}>
            <Pressable
              disabled={busy}
              onPress={() => respondToFollowRequest(item, false)}
              style={[
                styles.actionButton,
                {
                  borderColor: colors.separator,
                  opacity: busy ? 0.5 : 1,
                },
              ]}
            >
              <Text style={[styles.decline, { color: colors.text }]}>
                Decline
              </Text>
            </Pressable>

            <Pressable
              disabled={busy}
              onPress={() => respondToFollowRequest(item, true)}
              style={[
                styles.actionButton,
                styles.acceptButton,
                {
                  backgroundColor: Colors.accent,
                  borderColor: Colors.accent,
                  opacity: busy ? 0.5 : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.accept}>Approve</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "Notifications",
          headerTitleStyle: {
            color: colors.text,
          },
          headerBackButtonDisplayMode: "minimal",
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
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <MaterialIcons
              name="notifications-none"
              size={48}
              color={colors.secondary}
            />

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications
            </Text>

            <Text style={[styles.emptyText, { color: colors.secondary }]}>
              New activity will appear here and stay on this device for 30
              days.
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => refresh(true)}
                tintColor={colors.text}
              />
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  list: {
    padding: 16,
    paddingTop: 100,
    gap: 10,
    paddingBottom: 30,
  },

  notificationCard: {
    borderRadius: 22,
    padding: 16,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },

  bodyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
  },

  actorName: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
  },

  actionPressable: {
    marginLeft: 4,
    maxWidth: "100%",
  },

  body: {
    fontSize: 14,
    lineHeight: 19,
  },

  date: {
    fontSize: 12,
    marginTop: 7,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  acceptButton: {
    borderWidth: 1,
  },

  decline: {
    fontSize: 15,
    fontWeight: "600",
  },

  accept: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 34,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    marginTop: 14,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },
});