import { supabase } from "@/app/utils/supabase";
import PostContainer from "@/components/post";
import SupabaseImage from "@/components/SupabaseImage";
import { fetchPostPage, type FeedPost } from "./utils/postFeed";
import { getCurrentUser } from "./utils/auth";
import { Colors } from "@/styles/colors";
import { Button, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
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
import { useAccent } from "./context/accent";

type CircleData = {
  id: string;
  name: string;
  color: string;
  icon_type: string | null;
  icon_value: string | null;
  chat_enabled: boolean;
  created_by: string;
};

type CircleMember = {
  user_id: string;
  role: "admin" | "manager" | "member";
};

type Post = FeedPost;

export default function CircleScreen() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const { accent } = useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [circle, setCircle] = useState<CircleData | null>(null);
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState("");

  async function loadCircle() {
    if (!id) return;

    try {
      const user = await getCurrentUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: circleData, error: circleError } = await supabase
        .from("circles")
        .select(
          "id, name, color, icon_type, icon_value, chat_enabled, created_by",
        )
        .eq("id", id)
        .single();

      if (circleError) {
        console.error("Error fetching Circle:", circleError);
        setCircle(null);
        return;
      }

      setCircle(circleData);

      const { data: memberData, error: memberError } = await supabase
        .from("circle_members")
        .select("user_id, role")
        .eq("circle_id", id);

      if (memberError) {
        console.error("Error fetching Circle members:", memberError);
      } else {
        setMembers(memberData ?? []);
      }

      const result = await fetchPostPage({
        mode: {
          type: "circle",
          circleId: id,
        },
        currentUserId: user.id,
        page: 0,
        pageSize: 20,
      });

      setPosts(result.posts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadCircle();
  }, [id]);

  function confirmDeleteCircle() {
    Alert.alert(
      "Delete Circle",
      `Are you sure you want to delete “${circle?.name}”? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!circle) return;

            const { error } = await supabase
              .from("circles")
              .delete()
              .eq("id", circle.id);

            if (error) {
              console.error("Error deleting Circle:", error);
              Alert.alert("Error", "The circle could not be deleted.");
              return;
            }

            router.back();
          },
        },
      ],
    );
  }

  function getCircleIcon() {
    if (!circle) return null;

    if (circle.icon_type === "photo" && circle.icon_value) {
      return (
        <SupabaseImage
          uri={circle.icon_value}
          style={styles.circleIconImage}
          contentFit="cover"
        />
      );
    }

    if (circle.icon_type === "emoji" && circle.icon_value) {
      return <Text style={styles.circleEmoji}>{circle.icon_value}</Text>;
    }

    const firstLetter = circle.name.trim().charAt(0).toUpperCase();

    return (
      <Text
        style={[
          styles.circleMonogram,
          {
            color: colors.text,
          },
        ]}
      >
        {firstLetter || "C"}
      </Text>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!circle) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <MaterialIcons
          name="error-outline"
          size={48}
          color={colors.secondary}
        />

        <Text
          style={[
            styles.errorTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Circle not found
        </Text>

        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <GlassView isInteractive style={styles.errorGlassButton}>
            <Text
              style={[
                styles.errorButtonText,
                {
                  color: colors.text,
                },
              ]}
            >
              Go Back
            </Text>
          </GlassView>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerBackTitle: "",
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
        <View
          style={[
            styles.colorBackground,
            {
              backgroundColor: circle.color,
            },
          ]}
        />

        <LinearGradient
          colors={[`${circle.color}00`, colors.background]}
          style={styles.colorFade}
          pointerEvents="none"
        />

        <View style={styles.headerButtons}>
          <Pressable onPress={() => router.push("/newPost")}>
            <GlassView isInteractive style={styles.glassButton}>
              <Ionicons name="add" size={30} color={colors.text} />
            </GlassView>
          </Pressable>
          {circle.chat_enabled && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/circleChat",
                  params: { circleId: circle.id },
                })
              }
            >
              <GlassView isInteractive style={styles.glassButton}>
                <Ionicons
                  name="chatbubble-outline"
                  size={23}
                  color={colors.text}
                />
              </GlassView>
            </Pressable>
          )}

          <GlassView isInteractive style={styles.glassButton}>
            <Host>
              <Menu
                label={
                  <RNHostView matchContents>
                    <MaterialIcons
                      name="more-horiz"
                      size={27}
                      color={colors.text}
                    />
                  </RNHostView>
                }
              >
                <Button
                  systemImage="person.2"
                  label="Members"
                  onPress={() =>
                    router.push({
                      pathname: "/circleMembers",
                      params: { circleId: circle.id },
                    })
                  }
                />
                <Button
                  systemImage="gear"
                  label={`${circle.name} Settings`}
                  onPress={() =>
                    router.push({
                      pathname: "/circleSettings",
                      params: { circleId: circle.id },
                    })
                  }
                />
              </Menu>
            </Host>
          </GlassView>
        </View>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <GlassView isInteractive style={styles.glassButton}>
            <Ionicons name="chevron-back" size={25} color={colors.text} />
          </GlassView>
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadCircle();
              }}
            />
          }
        >
          <View style={styles.circleHeader}>
            <View
              style={[
                styles.circleIcon,
                {
                  backgroundColor: `${circle.color}45`,
                  borderColor: `${circle.color}80`,
                },
              ]}
            >
              {getCircleIcon()}
            </View>

            <Text
              style={[
                styles.circleName,
                {
                  color: colors.text,
                },
              ]}
            >
              {circle.name}
            </Text>

            <Text
              style={[
                styles.circleSubtitle,
                {
                  color: colors.secondary,
                },
              ]}
            >
              Private Circle
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <Pressable
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.stats,
                },
              ]}
            >
              <Text
                style={[
                  styles.statNumber,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {members.length}
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  {
                    color: colors.secondary,
                  },
                ]}
              >
                Members
              </Text>
            </Pressable>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.stats,
                },
              ]}
            >
              <Text
                style={[
                  styles.statNumber,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {posts.length}
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  {
                    color: colors.secondary,
                  },
                ]}
              >
                Posts
              </Text>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.stats,
                },
              ]}
            >
              <MaterialIcons
                name="chat-bubble-outline"
                size={21}
                color={colors.text}
              />

              <Text
                style={[
                  styles.statLabel,
                  {
                    color: colors.secondary,
                  },
                ]}
              >
                {circle.chat_enabled ? "Chat On" : "Chat Off"}
              </Text>
            </View>
          </View>

          <View style={styles.postSection}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Posts
            </Text>

            {posts.length === 0 ? (
              <View
                style={[
                  styles.emptyPosts,
                  {
                    backgroundColor: colors.stats,
                  },
                ]}
              >
                <MaterialIcons
                  name="photo-library"
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
                  No posts yet
                </Text>

                <Text
                  style={[
                    styles.emptyDescription,
                    {
                      color: colors.secondary,
                    },
                  ]}
                >
                  Posts shared with this Circle will appear here.
                </Text>
              </View>
            ) : (
              posts.map((post) => (
                <PostContainer
                  key={post.id}
                  userId={post.user_id}
                  id={post.id}
                  time={post.created_at}
                  href={post.image ?? ""}
                  caption={post.caption}
                  profile={post.profiles}
                  postSettings={{
                    allow_comments: post.allow_comments,
                    allow_sharing: post.allow_sharing,
                    allow_reactions: post.allow_reactions,
                  }}
                  likeCount={post.like_count}
                  isLiked={post.is_liked}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  colorBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 310,
    opacity: 0.75,
  },

  colorFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 310,
  },

  content: {
    paddingHorizontal: 16,
  },

  backButton: {
    position: "absolute",
    left: 16,
    top: 60,
    zIndex: 20,
  },

  headerButtons: {
    position: "absolute",
    right: 16,
    top: 60,
    zIndex: 20,
    flexDirection: "row",
    gap: 10,
  },

  glassButton: {
    width: 50,
    height: 50,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },

  circleHeader: {
    alignItems: "center",
    paddingTop: 58,
  },

  circleIcon: {
    width: 120,
    height: 120,
    borderRadius: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 16,
  },

  circleIconImage: {
    width: "100%",
    height: "100%",
  },

  circleEmoji: {
    fontSize: 58,
  },

  circleMonogram: {
    fontSize: 50,
    fontWeight: "700",
  },

  circleName: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },

  circleSubtitle: {
    fontSize: 15,
    marginTop: 4,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
  },

  statCard: {
    flex: 1,
    minHeight: 82,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
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

  postSection: {
    marginTop: 24,
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
    marginHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },

  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
    maxWidth: 280,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },

  errorButton: {
    marginTop: 20,
  },

  errorGlassButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  errorButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
