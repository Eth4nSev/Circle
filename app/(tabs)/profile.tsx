import { supabase } from "@/app/utils/supabase";
import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function ProfileScreen() {
  const theme = useColorScheme() ?? "light";

  const [posts, setPosts] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Display Name");
  const [username, setUsername] = useState("username");

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [refreshing, setRefreshing] = useState(false);

  async function refreshData() {
    setRefreshing(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching auth user:", userError);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("avatar_url, display_name, username")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profile) {
        setProfileImage(profile.avatar_url ?? null);
        setDisplayName(profile.display_name ?? "Display Name");
        setUsername(profile.username ?? "username");
      }

      const { data: userPosts, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
      } else {
        setPosts(userPosts ?? []);
      }

      const { count: followers, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      if (followersError) {
        console.error("Error fetching followers:", followersError);
      } else {
        setFollowerCount(followers ?? 0);
      }

      const { count: following, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);

      if (followingError) {
        console.error("Error fetching following:", followingError);
      } else {
        setFollowingCount(following ?? 0);
      }
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

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
            backgroundColor: Colors[theme as "light" | "dark"].background,
          },
        ]}
      >
        <Pressable
          style={styles.settingsButton}
          onPress={() => router.push("/settings/home")}
        >
          <GlassView isInteractive style={styles.glassButton}>
            <MaterialIcons
              name="settings"
              size={24}
              color={Colors[theme as "light" | "dark"].text}
            />
          </GlassView>
        </Pressable>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push("/editProfile")}
        >
          <GlassView isInteractive style={styles.glassButton}>
            <Ionicons
              name="pencil"
              color={Colors[theme as "light" | "dark"].text}
              size={24}
            />
          </GlassView>
        </Pressable>

        {profileImage && (
          <>
            <Image
              source={{ uri: profileImage }}
              blurRadius={10}
              style={{
                width: "100%",
                height: 300,
                position: "absolute",
              }}
            />

            <LinearGradient
              colors={[
                "transparent",
                Colors[theme as "light" | "dark"].background,
              ]}
              style={styles.profileImageFade}
              pointerEvents="none"
            />
          </>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refreshData} />
          }
        >
          <View style={styles.profileHeader}>
            <View style={styles.profilePicture}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={[
                    styles.profilePictureImage,
                    {
                      borderColor: Colors[theme as "light" | "dark"].separator,
                    },
                  ]}
                />
              ) : (
                <MaterialIcons
                  name="person"
                  size={55}
                  color={Colors[theme as "light" | "dark"].secondary}
                />
              )}
            </View>

            <Text
              style={[
                styles.displayName,
                {
                  color: Colors[theme as "light" | "dark"].text,
                },
              ]}
            >
              {displayName}
            </Text>

            <Text
              style={[
                styles.username,
                {
                  color: Colors[theme as "light" | "dark"].secondary,
                },
              ]}
            >
              @{username}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <Pressable
              onPress={() => router.push("/followers")}
              style={[
                styles.statCard,
                {
                  backgroundColor: Colors[theme as "light" | "dark"].stats,
                },
              ]}
            >
              <Text
                style={[
                  styles.statNumber,
                  {
                    color: Colors[theme as "light" | "dark"].text,
                  },
                ]}
              >
                {followerCount}
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  {
                    color: Colors[theme as "light" | "dark"].secondary,
                  },
                ]}
              >
                Followers
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/following")}
              style={[
                styles.statCard,
                {
                  backgroundColor: Colors[theme as "light" | "dark"].stats,
                },
              ]}
            >
              <Text
                style={[
                  styles.statNumber,
                  {
                    color: Colors[theme as "light" | "dark"].text,
                  },
                ]}
              >
                {followingCount}
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  {
                    color: Colors[theme as "light" | "dark"].secondary,
                  },
                ]}
              >
                Following
              </Text>
            </Pressable>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: Colors[theme as "light" | "dark"].stats,
                },
              ]}
            >
              <Text
                style={[
                  styles.statNumber,
                  {
                    color: Colors[theme as "light" | "dark"].text,
                  },
                ]}
              >
                {posts.length}
              </Text>

              <Text
                style={[
                  styles.statLabel,
                  {
                    color: Colors[theme as "light" | "dark"].secondary,
                  },
                ]}
              >
                Posts
              </Text>
            </View>
          </View>

          <View style={styles.postSection}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: Colors[theme as "light" | "dark"].text,
                },
              ]}
            >
              Posts
            </Text>

            {posts.map((post) => (
              <PostContainer
                key={post.id}
                userId={post.user_id}
                id={post.id}
                time={post.created_at}
                href={post.image}
                caption={post.caption}
              />
            ))}
          </View>
        </ScrollView>
      </View>
      <StatusBar barStyle={"light-content"} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
  },

  settingsButton: {
    position: "absolute",
    right: 16,
    zIndex: 16,
    top: 60,
  },
  editButton: {
    position: "absolute",
    left: 16,
    zIndex: 16,
    top: 60,
  },

  profileImageFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },

  glassButton: {
    width: 50,
    height: 50,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  profileHeader: {
    alignItems: "center",
    paddingTop: 45,
  },

  profilePicture: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(128, 128, 128, 0.2)",
    marginBottom: 14,
    overflow: "hidden",
  },
  profilePictureImage: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
    borderWidth: StyleSheet.hairlineWidth,
  },

  displayName: {
    fontSize: 26,
    fontWeight: "700",
  },

  username: {
    fontSize: 16,
    marginTop: 3,
  },

  bio: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 300,
    lineHeight: 21,
  },

  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 28,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
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

  section: {
    marginTop: 32,
  },
  postSection: {
    marginTop: 16,
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },

  emptyDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  followButtonContainer: {
    width: "100%",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    borderRadius: 30,
  },
  followButton: {
    width: "100%",
    height: 52,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  followButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
