import { supabase } from "@/app/utils/supabase";
import SupabaseImage from "@/components/SupabaseImage";
import { Colors } from "@/styles/colors";
import { Button, Host, Menu, RNHostView } from "@expo/ui/swift-ui";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { sendNotification } from "@/app/utils/notifications";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
  username: string | null;
  display_name?: string | null;
  avatar_url: string | null;
};

type PostSettings = {
  allow_comments: boolean;
  allow_sharing: boolean;
  allow_reactions: boolean;
};

type Props = {
  id: string;
  userId: string;
  time: string;
  href: string;
  caption?: string | null;
  profile?: Profile | null;
  postSettings?: PostSettings;
  likeCount?: number;
  isLiked?: boolean;
  currentUserId: string;
  onDeleted?: () => void;
};

export default function PostContainer({
  id,
  userId,
  time,
  href,
  caption,
  profile: initialProfile = null,
  postSettings: initialPostSettings = {
    allow_comments: true,
    allow_sharing: true,
    allow_reactions: true,
  },
  likeCount: initialLikeCount = 0,
  isLiked: initialIsLiked = false,
  currentUserId,
  onDeleted,
}: Props) {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [postImageAspectRatio, setPostImageAspectRatio] = useState(1);
  const [postSettings, setPostSettings] = useState<PostSettings>(initialPostSettings);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [likeLoading, setLikeLoading] = useState(false);

  const isOwnPost = currentUserId === userId;

  useEffect(() => {
    setProfile(initialProfile);
    setPostSettings(initialPostSettings);
    setIsLiked(initialIsLiked);
    setLikeCount(initialLikeCount);
  }, [initialProfile, initialPostSettings, initialIsLiked, initialLikeCount]);

  const likePost = async () => {
    if (likeLoading) return;

    setLikeLoading(true);

    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikeCount((count) =>
      Math.max(0, count + (wasLiked ? -1 : 1)),
    );

    Haptics.selectionAsync().catch(() => {});

    const result = wasLiked
      ? await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", id)
          .eq("user_id", currentUserId)
      : await supabase.from("post_likes").insert({
          post_id: id,
          user_id: currentUserId,
        });

    if (result.error) {
      console.error(
        wasLiked ? "Error unliking post:" : "Error liking post:",
        result.error,
      );
      setIsLiked(wasLiked);
      setLikeCount((count) =>
        Math.max(0, count + (wasLiked ? 1 : -1)),
      );
    } else if (!wasLiked && userId !== currentUserId) {
      await sendNotification({
        recipientId: userId,
        type: "like",
        data: {
          postId: id,
          actorId: currentUserId,
        },
      });
    }

    setLikeLoading(false);
  };

  const openProfile = () => {
    if (isOwnPost) {
      router.push("/(tabs)/profile");
    } else {
      router.push({
        pathname: "/profiles",
        params: {
          id: userId,
        },
      });
    }
  };

  const openComments = () => {
    if (!postSettings.allow_comments) return;

    router.push({
      pathname: "/comments",
      params: {
        postId: id,
      },
    });
  };

  const sharePost = () => {
    if (!postSettings.allow_sharing) return;

    Alert.alert("Share", "Post sharing will be added here.");
  };

  const deletePost = () => {
    Alert.alert("Delete", "Are you sure you want to delete this post?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: confirmDeletePost,
      },
    ]);
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

  const reportPost = () => {
    Alert.alert("Report Post", "Why are you reporting this post?", [
      {
        text: "Spam",
        onPress: () => enterReportMessage("Spam"),
      },
      {
        text: "Harassment",
        onPress: () => enterReportMessage("Harassment"),
      },
      {
        text: "Hate or discrimination",
        onPress: () => enterReportMessage("Hate or discrimination"),
      },
      {
        text: "Threats or violence",
        onPress: () => enterReportMessage("Threats or violence"),
      },
      {
        text: "Explicit content",
        onPress: () => enterReportMessage("Explicit content"),
      },
      {
        text: "Other",
        onPress: () => enterReportMessage("Other"),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const enterReportMessage = (reason: string) => {
    Alert.prompt(
      "Add a message",
      "Tell us anything else that may help us review this report. This is optional.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Submit Report",
          onPress: (message?: string) => {
            const reportMessage =
              typeof message === "string" ? message.trim() || null : null;

            submitReport(reason, reportMessage);
          },
        },
      ],
      "plain-text",
    );
  };

  const submitReport = async (reason: string, message: string | null) => {
    if (!currentUserId) {
      Alert.alert(
        "Couldn't Report Post",
        "You must be signed in to report a post.",
      );
      return;
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: currentUserId,
      post_id: id,
      reported_user_id: userId,
      reason,
      message,
    });

    if (error) {
      console.error("Error reporting post:", error);

      if (error.code === "23505") {
        Alert.alert(
          "Already Reported",
          "You have already reported this post.",
        );
        return;
      }

      Alert.alert(
        "Couldn't Report Post",
        "Something went wrong while submitting your report.",
      );

      return;
    }

    Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});

    Alert.alert("Report Submitted", "Thanks for helping keep Circle safe.");
  };

  return (
    <>
      {isLiquidGlassAvailable() ? (
        <GlassView style={styles.postContainer}>
          <Pressable onPress={openProfile} style={styles.postAccount}>
            {profile?.avatar_url ? (
              <SupabaseImage
                uri={profile.avatar_url}
                style={styles.pfp}
                contentFit="cover"
              />
            ) : (
              <Image
                source={require("@/assets/images/icon.png")}
                style={styles.pfp}
              />
            )}

            <Text style={[styles.postAccountName, { color: colors.text }]}>
              @{profile?.username ?? "unknown"}
            </Text>

            <Text style={{ color: colors.secondary }}>{"\u2022"}</Text>

            <Text style={[styles.timeStamp, { color: colors.secondary }]}>
              {formatRelativeTime(time)}
            </Text>
          </Pressable>

          <SupabaseImage
            source={href}
            style={[
              styles.postImage,
              {
                aspectRatio: postImageAspectRatio,
              },
            ]}
            contentFit="contain"
            cachePolicy="disk"
            onLoad={(event) => {
              const { width, height } = event.source;

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

            {postSettings.allow_comments && (
              <Pressable onPress={openComments}>
                <Ionicons
                  name="chatbubble-outline"
                  size={iconSize}
                  color={colors.text}
                />
              </Pressable>
            )}

            <View style={styles.morePostOptions}>
              <Host matchContents>
                <Menu
                  label={
                    <RNHostView matchContents>
                      <MaterialIcons
                        name="more-horiz"
                        color={colors.text}
                        size={iconSize}
                      />
                    </RNHostView>
                  }
                >
                  {isOwnPost ? (
                    <Button
                      systemImage="pencil"
                      label="Edit"
                      onPress={() =>
                        router.push({
                          pathname: "/editPost",
                          params: {
                            postId: id,
                          },
                        })
                      }
                    />
                  ) : null}
                  {/* {(postSettings.allow_sharing || isOwnPost) && (
                    <Button
                      systemImage="square.and.arrow.up"
                      label="Share"
                      onPress={sharePost}
                    />
                  )} */}

                  <Button
                    systemImage="person"
                    label="Go to Profile"
                    onPress={openProfile}
                  />

                  {isOwnPost ? (
                    <Button
                      systemImage="trash"
                      label="Delete"
                      role="destructive"
                      onPress={deletePost}
                    />
                  ) : (
                    <Button
                      systemImage="exclamationmark.bubble"
                      label="Report"
                      onPress={reportPost}
                    />
                  )}
                </Menu>
              </Host>
            </View>
          </View>

          {caption ? (
            <Text style={[styles.caption, { color: colors.text }]}>
              {caption}
            </Text>
          ) : null}
        </GlassView>
      ) : null}
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
    alignItems: "center",
    gap: 20,
    marginTop: 10,
  },

  morePostOptions: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
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

  likeCount: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
