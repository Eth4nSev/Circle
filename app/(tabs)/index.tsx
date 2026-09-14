import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { Button, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function Index() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const [posts, setPosts] = useState<any[]>([]);
  const [circles, setCircles] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [selectedCircleName, setSelectedCircleName] = useState("Home");

  const scrollY = useRef(new Animated.Value(0)).current;

  const clampedScrollY = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolateLeft: "clamp",
  });

  const translateY = Animated.diffClamp(clampedScrollY, 0, 200);

  async function getPosts(
    circleId: string | null = selectedCircle,
    isRefreshing = false,
  ) {
    if (isRefreshing) setRefreshing(true);

    const userIds = await getFollowedUserIds();

    if (userIds.length === 0) {
      setPosts([]);
      setRefreshing(false);
      return;
    }

    let query = supabase
      .from("posts")
      .select("*")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    if (circleId) {
      query = query.eq("circle_id", circleId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data ?? []);
    }

    if (isRefreshing) setRefreshing(false);
  }

  async function getFollowedUserIds() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    if (error) {
      console.error("Error fetching follows:", error);
      return [];
    }

    return [user.id, ...(data ?? []).map((follow) => follow.following_id)];
  }

  async function getCircles() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("circle_members")
      .select("circle_id, circles(id, name)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching circles:", error);
    } else {
      setCircles(
        (data ?? []).map((membership) => membership.circles).filter(Boolean),
      );
    }
  }

  useEffect(() => {
    getPosts();
    getCircles();
  }, []);

  return (
    <>
      <ScrollView
        style={{
          backgroundColor: Colors[theme as "light" | "dark"].background,
          flex: 1,
        }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => getPosts(selectedCircle, true)}
            tintColor={Colors[theme as "light" | "dark"].text}
          />
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Host matchContents style={{ marginLeft: 8 }}>
            <Menu
              label={
                <RNHostView matchContents>
                  <GlassView
                    style={{
                      width: 100,
                      height: 50,
                      paddingVertical: 5,
                      justifyContent: "center",
                      alignItems: "center",
                      margin: 10,
                      borderRadius: 50,
                    }}
                    isInteractive
                  >
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "bold",
                        fontSize: 20,
                      }}
                    >
                      {selectedCircleName}
                    </Text>
                  </GlassView>
                </RNHostView>
              }
            >
              <Button
                systemImage="globe"
                label="All"
                onPress={() => {
                  setSelectedCircle(null);
                  setSelectedCircleName("Home");
                  getPosts(null);
                }}
              />

              <Menu systemImage="person.2.fill" label="Circles">
                {circles.map((circle) => (
                  <Button
                    key={circle.id}
                    label={circle.name}
                    onPress={() => {
                      setSelectedCircle(circle.id);
                      setSelectedCircleName(circle.name);
                      getPosts(circle.id);
                    }}
                  />
                ))}
              </Menu>
            </Menu>
          </Host>
          <Pressable onPress={() => router.push("/newPost")}>
            <GlassView
              style={{
                width: 50,
                height: 50,
                paddingVertical: 5,
                justifyContent: "center",
                alignItems: "center",
                margin: 10,
                borderRadius: 50,
              }}
              isInteractive
            >
              <Ionicons name="add" size={30} color={colors.text} />
            </GlassView>
          </Pressable>
        </View>
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
              Posts from people you follow will appear here.
            </Text>
          </View>
        ) : (
          posts.map((post) => (
            <PostContainer
              key={post.id}
              userId={post.user_id}
              id={post.id}
              time={post.created_at}
              href={post.image}
              caption={post.caption}
            />
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
});
