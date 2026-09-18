import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Invitation = {
  id: string;
  circle_id: string;
  inviter_id: string;
  status: string;
  circles: {
    id: string;
    name: string;
    color: string;
    icon_type: "photo" | "emoji" | "monogram" | null;
    icon_value: string | null;
  } | null;
  inviter: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function CircleInvites() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  async function loadInvitations(isRefreshing = false) {
    if (isRefreshing) setRefreshing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setInvitations([]);
        return;
      }

      const { data: invitationData, error: invitationError } =
        await supabase
          .from("circle_invitations")
          .select("id, circle_id, inviter_id, status")
          .eq("invitee_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

      if (invitationError) {
        console.error(
          "Error fetching Circle invitations:",
          invitationError,
        );
        Alert.alert("Error", "Circle invites could not be loaded.");
        setInvitations([]);
        return;
      }

      const rows = invitationData ?? [];

      if (rows.length === 0) {
        setInvitations([]);
        return;
      }

      const circleIds = [...new Set(rows.map((item) => item.circle_id))];
      const inviterIds = [...new Set(rows.map((item) => item.inviter_id))];

      const [{ data: circleData, error: circleError }, { data: profileData, error: profileError }] =
        await Promise.all([
          supabase
            .from("circles")
            .select("id, name, color, icon_type, icon_value")
            .in("id", circleIds),
          supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", inviterIds),
        ]);

      if (circleError || profileError) {
        console.error(
          "Error loading invitation details:",
          circleError || profileError,
        );
        Alert.alert("Error", "Circle invite details could not be loaded.");
        setInvitations([]);
        return;
      }

      const circlesById = new Map(
        (circleData ?? []).map((circle) => [circle.id, circle]),
      );
      const profilesById = new Map(
        (profileData ?? []).map((profile) => [profile.id, profile]),
      );

      setInvitations(
        rows.map((invitation) => ({
          ...invitation,
          circles: circlesById.get(invitation.circle_id) ?? null,
          inviter: profilesById.get(invitation.inviter_id) ?? null,
        })),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadInvitations();
  }, []);

  async function respondToInvite(invitation: Invitation, accept: boolean) {
    setProcessing(invitation.id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      if (accept) {
        const { error: memberError } = await supabase
          .from("circle_members")
          .insert({
            circle_id: invitation.circle_id,
            user_id: user.id,
            role: "member",
          });

        if (memberError) {
          console.error("Error joining Circle:", memberError);
          Alert.alert("Could Not Join", memberError.message);
          return;
        }
      }

      const { error: invitationError } = await supabase
        .from("circle_invitations")
        .update({
          status: accept ? "accepted" : "declined",
        })
        .eq("id", invitation.id)
        .eq("invitee_id", user.id);

      if (invitationError) {
        console.error("Error updating invitation:", invitationError);

        if (accept) {
          await supabase
            .from("circle_members")
            .delete()
            .eq("circle_id", invitation.circle_id)
            .eq("user_id", user.id);
        }

        Alert.alert("Error", "The invitation could not be updated.");
        return;
      }

      setInvitations((current) =>
        current.filter((item) => item.id !== invitation.id),
      );
    } finally {
      setProcessing(null);
    }
  }

  function getCircleIcon(invitation: Invitation) {
    const circle = invitation.circles;

    if (!circle) {
      return <Ionicons name="people" size={28} color="#fff" />;
    }

    if (circle.icon_type === "photo" && circle.icon_value) {
      return (
        <Image
          source={{ uri: circle.icon_value }}
          style={styles.circleIconImage}
        />
      );
    }

    if (circle.icon_type === "emoji" && circle.icon_value) {
      return <Text style={styles.circleEmoji}>{circle.icon_value}</Text>;
    }

    return (
      <Text style={styles.circleMonogram}>
        {(circle.icon_value || circle.name.charAt(0)).toUpperCase()}
      </Text>
    );
  }

  function getInviterName(invitation: Invitation) {
    return (
      invitation.inviter?.display_name ||
      invitation.inviter?.username ||
      "Someone"
    );
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
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadInvitations(true)}
              tintColor={colors.text}
            />
          }
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <GlassView isInteractive style={styles.headerButton}>
                <Ionicons
                  name="chevron-back"
                  size={25}
                  color={colors.text}
                />
              </GlassView>
            </Pressable>

            <Text style={[styles.title, { color: colors.text }]}>
              Circle Invites
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.text} />
            </View>
          ) : invitations.length === 0 ? (
            <View style={styles.empty}>
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <Ionicons
                  name="mail-open-outline"
                  size={32}
                  color={colors.secondary}
                />
              </View>

              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No Circle invites
              </Text>

              <Text
                style={[styles.emptyText, { color: colors.secondary }]}
              >
                Invitations from people you know will appear here.
              </Text>
            </View>
          ) : (
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.secondary,
                  },
                ]}
              >
                PENDING
              </Text>

              {invitations.map((invitation) => {
                const circle = invitation.circles;
                const busy = processing === invitation.id;

                return (
                  <View
                    key={invitation.id}
                    style={[
                      styles.inviteCard,
                      {
                        backgroundColor: colors.card,
                      },
                    ]}
                  >
                    <View style={styles.inviteTop}>
                      <View
                        style={[
                          styles.circleIcon,
                          {
                            backgroundColor: circle?.color || "#17b3da",
                          },
                        ]}
                      >
                        {getCircleIcon(invitation)}
                      </View>

                      <View style={styles.inviteInfo}>
                        <Text
                          style={[
                            styles.circleName,
                            {
                              color: colors.text,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {circle?.name || "Circle"}
                        </Text>

                        <Text
                          style={[
                            styles.inviteText,
                            {
                              color: colors.secondary,
                            },
                          ]}
                          numberOfLines={2}
                        >
                          {getInviterName(invitation)} invited you to join
                          this Circle.
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actions}>
                      <Pressable
                        disabled={busy}
                        onPress={() =>
                          respondToInvite(invitation, false)
                        }
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.declineButton,
                          {
                            borderColor: colors.separator,
                            opacity: pressed || busy ? 0.6 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.declineText,
                            {
                              color: colors.text,
                            },
                          ]}
                        >
                          Decline
                        </Text>
                      </Pressable>

                      <Pressable
                        disabled={busy}
                        onPress={() =>
                          respondToInvite(invitation, true)
                        }
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.acceptButton,
                          {
                            backgroundColor: "#17b3da",
                            opacity: pressed || busy ? 0.6 : 1,
                          },
                        ]}
                      >
                        {busy ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.acceptText}>Join Circle</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpacer: {
    width: 48,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },

  loading: {
    paddingTop: 80,
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginHorizontal: 4,
    marginBottom: 10,
  },

  inviteCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
  },

  inviteTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  circleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  circleIconImage: {
    width: "100%",
    height: "100%",
  },

  circleEmoji: {
    fontSize: 32,
  },

  circleMonogram: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "700",
  },

  inviteInfo: {
    flex: 1,
    marginLeft: 14,
  },

  circleName: {
    fontSize: 18,
    fontWeight: "700",
  },

  inviteText: {
    fontSize: 14,
    lineHeight: 19,
    marginTop: 4,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  actionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  declineButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },

  acceptButton: {
    borderWidth: 1,
    borderColor: "#17b3da",
  },

  declineText: {
    fontSize: 15,
    fontWeight: "600",
  },

  acceptText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  empty: {
    alignItems: "center",
    paddingHorizontal: 36,
    paddingTop: 90,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
  },
});
