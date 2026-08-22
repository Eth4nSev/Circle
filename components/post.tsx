import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const iconSize = 30;

function formatRelativeTime(createdAt: string) {
  const timestamp = new Date(createdAt).getTime();
  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000),
  );

  if (!Number.isFinite(timestamp) || elapsedSeconds < 60) {
    return "now";
  }

  const units = [
    { seconds: 60 * 60 * 24 * 365, label: "year" },
    { seconds: 60 * 60 * 24 * 30, label: "month" },
    { seconds: 60 * 60 * 24 * 7, label: "week" },
    { seconds: 60 * 60 * 24, label: "day" },
    { seconds: 60 * 60, label: "hour" },
    { seconds: 60, label: "minute" },
  ];

  const unit = units.find(({ seconds }) => elapsedSeconds >= seconds);

  if (!unit) return "now";

  const value = Math.floor(elapsedSeconds / unit.seconds);

  return `${value} ${unit.label}${value === 1 ? "" : "s"} ago`;
}

type Profile = {
  username: string;
  avatar_url: string | null;
};

type Props = {
  id: string;
  userId: string;
  time: string;
  href: string;
  caption?: string | null;
  onDeleted?: () => void;
};

export default function PostContainer({
  id,
  userId,
  time,
  href,
  caption,
  onDeleted,
}: Props) {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme];

  const [profile, setProfile] = useState<Profile | null>(null);
  const [postImageAspectRatio, setPostImageAspectRatio] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isOwnPost, setIsOwnPost] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({
    top: 0,
    right: 0,
  });

  const moreButtonRef = useRef<View>(null);

  const loadLikes = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { count, error: countError } = await supabase
      .from("post_likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);

    if (countError) {
      console.error("Error loading like count:", countError);
    } else {
      setLikeCount(count ?? 0);
    }

    const { data, error } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading like status:", error);
    } else {
      setIsLiked(!!data);
    }
  };

  useEffect(() => {
    async function getProfile() {
      setLoadingProfile(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading post profile:", error);
      } else {
        setProfile(data);
      }

      setLoadingProfile(false);
    }

    async function checkPostOwner() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsOwnPost(user?.id === userId);
    }

    getProfile();
    checkPostOwner();
  }, [userId]);

  const likePost = async () => {
    if (likeLoading) return;

    setLikeLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLikeLoading(false);
      return;
    }

    await Haptics.selectionAsync();

    if (isLiked) {
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error unliking post:", error);
      } else {
        setIsLiked(false);
        setLikeCount((count) => Math.max(0, count - 1));
      }
    } else {
      const { error } = await supabase.from("post_likes").insert({
        post_id: id,
        user_id: user.id,
      });

      if (error) {
        console.error("Error liking post:", error);
      } else {
        setIsLiked(true);
        setLikeCount((count) => count + 1);
      }
    }

    setLikeLoading(false);
  };

  const openProfile = () => {
    router.push({
      pathname: "/(tabs)/search/profile",
      params: {
        id: userId,
      },
    });
  };

  const openPostMenu = () => {
    if (!isOwnPost) return;

    moreButtonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuPosition({
        top: y + height + 8,
        right: Math.max(12, 12),
      });

      setMenuVisible(true);
    });
  };

  const deletePost = () => {
    setMenuVisible(false);

    Alert.alert(
      "Delete Post?",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeletePost,
        },
      ],
    );
  };

  const confirmDeletePost = async () => {
    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting post:", error);

      Alert.alert(
        "Couldn't Delete Post",
        "Something went wrong while deleting your post.",
      );

      return;
    }

    onDeleted?.();
  };
  useEffect(() => {
    loadLikes();
  }, [id]);

  return (
    <>
      <GlassView style={styles.postContainer}>
        <Pressable onPress={openProfile} style={styles.postAccount}>
          {loadingProfile ? (
            <View style={styles.pfpPlaceholder}>
              <ActivityIndicator size="small" color={colors.secondary} />
            </View>
          ) : (
            <Image
              source={
                profile?.avatar_url
                  ? { uri: profile.avatar_url }
                  : require("@/assets/images/icon.png")
              }
              style={styles.pfp}
            />
          )}

          {loadingProfile ? (
            <ActivityIndicator size="small" color={colors.secondary} />
          ) : (
            <Text style={[styles.postAccountName, { color: colors.text }]}>
              @{profile?.username ?? "unknown"}
            </Text>
          )}

          <Text style={{ color: colors.secondary }}>{"\u2022"}</Text>

          <Text style={[styles.timeStamp, { color: colors.secondary }]}>
            {formatRelativeTime(time)}
          </Text>
        </Pressable>

        <Image
          source={{ uri: href }}
          style={[
            styles.postImage,
            {
              aspectRatio: postImageAspectRatio,
            },
          ]}
          resizeMode="contain"
          onLoad={(event) => {
            const { width, height } = event.nativeEvent.source;

            if (width && height) {
              setPostImageAspectRatio(width / height);
            }
          }}
        />

        <View style={styles.postOptions}>
          <Pressable onPress={likePost} disabled={likeLoading}>
            <View style={styles.likeContainer}>
              <FontAwesome
                name={isLiked ? "thumbs-up" : "thumbs-o-up"}
                size={iconSize}
                color={colors.text}
              />

              {likeCount > 0 ? (
                <Text style={[styles.likeCount, { color: colors.text }]}>
                  {likeCount}
                </Text>
              ) : null}
            </View>
          </Pressable>

          <Ionicons
            name="chatbubble-outline"
            size={iconSize}
            color={colors.text}
          />

          {/* <Link href="/emojiReact" asChild>
            <Pressable>
              <Entypo name="emoji-happy" size={iconSize} color={colors.text} />
            </Pressable>
          </Link> */}

          <View style={styles.morePostOptions}>
            <Pressable ref={moreButtonRef} onPress={openPostMenu} hitSlop={10}>
              <MaterialIcons
                name="more-horiz"
                size={iconSize}
                color={colors.text}
              />
            </Pressable>
          </View>
        </View>

        {caption ? (
          <Text style={[styles.caption, { color: colors.text }]}>
            {caption}
          </Text>
        ) : null}
      </GlassView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View
            style={[
              styles.contextMenu,
              {
                top: menuPosition.top,
                right: menuPosition.right,
                backgroundColor: colors.background,
              },
            ]}
          >
            <Pressable style={styles.menuItem} onPress={deletePost}>
              <MaterialIcons name="delete-outline" size={22} color="#ff3b30" />

              <Text style={styles.deleteText}>Delete Post</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: 15,
    borderRadius: 10,
    justifyContent: "center",
    marginHorizontal: 10,
    marginVertical: 10,
  },

  postImage: {
    width: "100%",
    height: undefined,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#000",
    borderRadius: 5,
  },

  postOptions: {
    flexDirection: "row",
    gap: 20,
    marginTop: 10,
  },

  morePostOptions: {
    position: "absolute",
    right: 0,
  },

  postAccount: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 5,
  },

  pfp: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },

  pfpPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  postAccountName: {
    fontSize: 16,
    fontWeight: "bold",
  },

  timeStamp: {
    fontSize: 12,
  },

  caption: {
    marginTop: 10,
  },

  likeContainer: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },

  menuOverlay: {
    flex: 1,
  },

  contextMenu: {
    position: "absolute",
    minWidth: 170,
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  deleteText: {
    color: "#ff3b30",
    fontSize: 16,
    fontWeight: "600",
  },
  likeCount: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
