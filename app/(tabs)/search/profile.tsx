import { supabase } from "@/app/utils/supabase";
import Back from "@/components/Back";
import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { MaterialIcons, Octicons } from "@expo/vector-icons";
import { GlassContainer, GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function ProfileScreen() {
  const theme = useColorScheme() ?? "light";
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [posts, setPosts] = useState<any[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Display Name");
  const [username, setUsername] = useState("username");

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  async function refreshData() {
    setRefreshing(true);

    try {
      if (!userId) return;

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching current user:", userError);
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, avatar_url, display_name, username")
        .eq("id", userId)
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
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
      } else {
        setPosts(userPosts ?? []);
      }

      const { count: followers, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      if (followersError) {
        console.error("Error fetching followers:", followersError);
      } else {
        setFollowerCount(followers ?? 0);
      }

      const { count: following, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      if (followingError) {
        console.error("Error fetching following:", followingError);
      } else {
        setFollowingCount(following ?? 0);
      }

      if (user.id !== userId) {
        const { data: follow, error: followError } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", userId)
          .maybeSingle();

        if (followError) {
          console.error("Error checking follow status:", followError);
        } else {
          setIsFollowing(!!follow);
        }
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function toggleFollow() {
    if (!userId || !currentUserId || currentUserId === userId) {
      return;
    }

    setFollowLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);

        if (error) {
          console.error("Error unfollowing user:", error);
          return;
        }

        setIsFollowing(false);
        setFollowerCount((count) => Math.max(0, count - 1));
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: userId,
        });

        if (error) {
          console.error("Error following user:", error);
          return;
        }

        setIsFollowing(true);
        setFollowerCount((count) => count + 1);
      }
    } finally {
      setFollowLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, [userId]);

  const isOwnProfile = currentUserId === userId;

  return (
    <>
      <Stack.Screen
        options={{
          headerBackTitle: "",
        }}
      />

      <Back />

      <View
        style={[
          styles.container,
          { backgroundColor: Colors[theme].background },
        ]}
      >
        <View style={styles.settingsButton}>
          <GlassContainer style={styles.glassButtonContainer} spacing={10}>
            <GlassView isInteractive style={styles.glassButton}>
              <Octicons name="share" size={24} color={Colors[theme].text} />
              <Octicons
                name="bell-slash"
                size={24}
                color={Colors[theme].text}
              />
            </GlassView>
            <GlassView isInteractive style={styles.glassButtonMini}>
              <Pressable>
                <MaterialIcons
                  name="more-horiz"
                  size={24}
                  color={Colors[theme].text}
                />
              </Pressable>
            </GlassView>
          </GlassContainer>

          {/* <GlassView style={styles.contextMenu} isInteractive>
            <Pressable style={styles.contextMenuItem}>
              <Ionicons name="share" size={20} color={Colors[theme].text} />
              <Text
                style={[styles.contextMenuText, { color: Colors[theme].text }]}
              >
                Share Profile Link
              </Text>
            </Pressable>

            <Pressable style={styles.contextMenuItem}>
              <Ionicons name="flag" size={20} color={Colors[theme].text} />
              <Text
                style={[styles.contextMenuText, { color: Colors[theme].text }]}
              >
                Report User
              </Text>
            </Pressable>
          </GlassView> */}
        </View>

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
              colors={["transparent", Colors[theme].background]}
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
                    { borderColor: Colors[theme].separator },
                  ]}
                />
              ) : (
                <MaterialIcons
                  name="person"
                  size={55}
                  color={Colors[theme].secondary}
                />
              )}
            </View>

            <Text style={[styles.displayName, { color: Colors[theme].text }]}>
              {displayName}
            </Text>

            <Text style={[styles.username, { color: Colors[theme].secondary }]}>
              @{username}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: Colors[theme].text }]}>
                {followerCount}
              </Text>

              <Text
                style={[styles.statLabel, { color: Colors[theme].secondary }]}
              >
                Followers
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: Colors[theme].text }]}>
                {followingCount}
              </Text>

              <Text
                style={[styles.statLabel, { color: Colors[theme].secondary }]}
              >
                Following
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: Colors[theme].text }]}>
                {posts.length}
              </Text>

              <Text
                style={[styles.statLabel, { color: Colors[theme].secondary }]}
              >
                Posts
              </Text>
            </View>
          </View>

          {!isOwnProfile && (
            <Pressable
              style={styles.followButtonContainer}
              onPress={toggleFollow}
              disabled={followLoading}
            >
              <GlassView
                tintColor={
                  isFollowing ? Colors[theme].separator : Colors.accent
                }
                style={styles.followButton}
                isInteractive
              >
                <Text
                  style={[
                    styles.followButtonText,
                    isFollowing && {
                      color: Colors[theme].text,
                    },
                  ]}
                >
                  {followLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : isFollowing ? (
                    "Following"
                  ) : (
                    "Follow"
                  )}
                </Text>
              </GlassView>
            </Pressable>
          )}

          <View style={styles.postSection}>
            <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
              Posts
            </Text>

            {posts.map((post) => (
              <PostContainer
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
    zIndex: 999,
    top: 60,
  },

  profileImageFade: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },

  glassButtonContainer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  glassButton: {
    width: 100,
    flexDirection: "row",
    gap: 25,
    height: 50,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  glassButtonMini: {
    width: 50,
    flexDirection: "row",
    gap: 25,
    height: 50,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  contextMenu: {
    position: "absolute",
    top: 58,
    right: 0,
    width: 210,
    borderRadius: 18,
    paddingVertical: 6,
  },

  contextMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  contextMenuText: {
    fontSize: 15,
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
