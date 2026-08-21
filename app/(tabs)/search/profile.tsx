import { supabase } from "@/app/utils/supabase";
import Back from "@/components/Back";
import { Colors } from "@/styles/colors";
import { MaterialIcons, Octicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
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
  const [refreshing, setRefreshing] = useState(false);

  async function refreshData() {
    setRefreshing(true);

    try {
      if (!userId) return;

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
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, [userId]);

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
        <Pressable style={styles.settingsButton}>
          <GlassView isInteractive style={styles.glassButton}>
            <Octicons name="bell-slash" size={24} color={Colors[theme].text} />
            <MaterialIcons
              name="more-horiz"
              size={24}
              color={Colors[theme].text}
            />
          </GlassView>
        </Pressable>
        {profileImage ? (
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
        ) : (
          <></>
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
                1
              </Text>
              <Text
                style={[styles.statLabel, { color: Colors[theme].secondary }]}
              >
                Followers
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: Colors[theme].text }]}>
                1
              </Text>
              <Text
                style={[styles.statLabel, { color: Colors[theme].secondary }]}
              >
                Following
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: Colors[theme].text }]}>
                3
              </Text>
              <Text
                style={[styles.statLabel, { color: Colors[theme].secondary }]}
              >
                Posts
              </Text>
            </View>
          </View>

          <Pressable style={styles.followButtonContainer}>
            <GlassView
              tintColor={Colors.accent}
              style={styles.followButton}
              isInteractive
            >
              <Text style={styles.followButtonText}>Follow</Text>
            </GlassView>
          </Pressable>

          <View style={styles.postSection}>
            <Text style={[styles.sectionTitle, { color: Colors[theme].text }]}>
              Posts
            </Text>
            {/* {posts.map((post) => (
              <PostContainer
                key={post.id}
                href={{ uri: post.image }}
                time={post.created_at}
                author={post.author}
                pfp={{ uri: post.pfp }}
                caption={post.caption}
              />
            ))} */}
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
    width: 100,
    flexDirection: "row",
    gap: 20,
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
