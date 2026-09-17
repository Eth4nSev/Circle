import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, useColorScheme, View } from "react-native";

type Props = { id: string; userId: string; time: string; href: string; caption?: string | null; onDeleted?: () => void };
type Profile = { username: string; avatar_url: string | null };

export default function AndroidPost({ id, userId, time, href, caption, onDeleted }: Props) {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const [profile, setProfile] = useState<Profile | null>(null);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [own, setOwn] = useState(false);
  const [ratio, setRatio] = useState(1);

  useEffect(() => {
    (async () => {
      const [{ data: profile }, { data: user }] = await Promise.all([
        supabase.from("profiles").select("username, avatar_url").eq("id", userId).single(),
        supabase.auth.getUser(),
      ]);
      setProfile(profile);
      setOwn(user.user?.id === userId);
      const { count } = await supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", id);
      setLikes(count ?? 0);
      if (user.user) {
        const { data } = await supabase.from("post_likes").select("id").eq("post_id", id).eq("user_id", user.user.id).maybeSingle();
        setLiked(!!data);
      }
    })();
  }, [id, userId]);

  const toggleLike = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const next = !liked;
    setLiked(next);
    setLikes((value) => Math.max(0, value + (next ? 1 : -1)));
    const result = next
      ? await supabase.from("post_likes").insert({ post_id: id, user_id: auth.user.id })
      : await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", auth.user.id);
    if (result.error) {
      setLiked(!next);
      setLikes((value) => Math.max(0, value + (next ? -1 : 1)));
    }
  };

  const deletePost = () => Alert.alert("Delete post", "Are you sure you want to delete this post?", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: async () => { const { error } = await supabase.from("posts").delete().eq("id", id).eq("user_id", userId); if (error) Alert.alert("Error", "The post could not be deleted."); else onDeleted?.(); } },
  ]);

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Pressable style={styles.account} onPress={() => own ? router.push("/(tabs)/profile") : router.push({ pathname: "/profiles", params: { id: userId } })}>
        <Image source={profile?.avatar_url ? { uri: profile.avatar_url } : require("@/assets/images/icon.png")} style={styles.avatar} />
        <Text style={[styles.username, { color: colors.text }]}>@{profile?.username ?? "unknown"}</Text>
        <Text style={[styles.time, { color: colors.secondary }]}>{new Date(time).toLocaleDateString()}</Text>
      </Pressable>
      <Image source={{ uri: href }} style={[styles.image, { aspectRatio: ratio }]} resizeMode="contain" onLoad={(event) => { const { width, height } = event.nativeEvent.source; if (width && height) setRatio(width / height); }} />
      {caption ? <Text style={[styles.caption, { color: colors.text }]}>{caption}</Text> : null}
      <View style={styles.actions}>
        <Pressable onPress={toggleLike} style={styles.action}><Ionicons name={liked ? "thumbs-up" : "thumbs-up-outline"} size={26} color={colors.text} /><Text style={{ color: colors.text }}>{likes}</Text></Pressable>
        <Pressable onPress={() => router.push({ pathname: "/comments", params: { postId: id } })} style={styles.action}><Ionicons name="chatbubble-outline" size={25} color={colors.text} /></Pressable>
        {own ? <Pressable onPress={deletePost} style={styles.action}><MaterialIcons name="delete-outline" size={26} color={colors.text} /></Pressable> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ card: { marginHorizontal: 10, marginVertical: 8, padding: 12, borderRadius: 16 }, account: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }, avatar: { width: 32, height: 32, borderRadius: 16 }, username: { fontSize: 16, fontWeight: "700" }, time: { fontSize: 12, marginLeft: "auto" }, image: { width: "100%", borderRadius: 8, backgroundColor: "#000" }, caption: { marginTop: 10, fontSize: 15 }, actions: { flexDirection: "row", alignItems: "center", gap: 22, marginTop: 12 }, action: { flexDirection: "row", alignItems: "center", gap: 5, minWidth: 40 } });
