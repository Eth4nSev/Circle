import { supabase } from "@/app/utils/supabase";
import Back from "@/components/Back";
import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { useAccent } from "./context/accent";

type Member = {
  user_id: string;
  role: "admin" | "manager" | "member";
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function CircleMembers() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const { accent } = useAccent();
  const [circleName, setCircleName] = useState("Circle");
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<Member["role"] | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMembers = async () => {
    if (!circleId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data: circle }, { data: rows, error }] = await Promise.all([
      supabase.from("circles").select("name").eq("id", circleId).single(),
      supabase.from("circle_members").select("user_id, role").eq("circle_id", circleId),
    ]);

    if (circle) setCircleName(circle.name);
    if (error) {
      console.error("Error loading Circle members:", error);
      setLoading(false);
      return;
    }

    const memberRows = rows ?? [];
    const userIds = memberRows.map((member) => member.user_id);
    const { data: profiles } = userIds.length
      ? await supabase.from("profiles").select("id, display_name, username, avatar_url").in("id", userIds)
      : { data: [] };

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    setMembers(memberRows.map((member) => {
      const profile = profileMap.get(member.user_id);
      return {
        user_id: member.user_id,
        role: member.role,
        display_name: profile?.display_name ?? null,
        username: profile?.username ?? null,
        avatar_url: profile?.avatar_url ?? null,
      };
    }));
    setCurrentUserRole(memberRows.find((member) => member.user_id === user.id)?.role ?? null);
    setLoading(false);
  };

  useEffect(() => {
    loadMembers();
  }, [circleId]);

  const changeRole = async (member: Member, role: "manager" | "member") => {
    if (!circleId || currentUserRole !== "admin" || member.role === "admin") return;
    const { error } = await supabase.from("circle_members").update({ role }).eq("circle_id", circleId).eq("user_id", member.user_id);
    if (error) {
      console.error("Error changing Circle role:", error);
      Alert.alert("Error", "The member role could not be changed.");
      return;
    }
    setMembers((current) => current.map((item) => item.user_id === member.user_id ? { ...item, role } : item));
  };

  const openRoleMenu = (member: Member) => {
    if (currentUserRole !== "admin" || member.role === "admin") return;
    Alert.alert("Change Role", member.display_name || member.username || "Circle member", [
      { text: "Manager", onPress: () => changeRole(member, "manager") },
      { text: "Member", onPress: () => changeRole(member, "member") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removeMember = (member: Member) => {
    if (!circleId || !["admin", "manager"].includes(currentUserRole ?? "") || member.role === "admin") return;
    Alert.alert("Remove Member", `Remove ${member.display_name || member.username || "this member"} from ${circleName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("circle_members").delete().eq("circle_id", circleId).eq("user_id", member.user_id);
          if (error) {
            console.error("Error removing Circle member:", error);
            Alert.alert("Error", "The member could not be removed.");
            return;
          }
          setMembers((current) => current.filter((item) => item.user_id !== member.user_id));
        },
      },
    ]);
  };

  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator /></View>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Back />
        <Text style={[styles.title, { color: colors.text }]}>{circleName} Members</Text>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.subtitle, { color: colors.secondary }]}>{members.length} {members.length === 1 ? "member" : "members"}</Text>
          <GlassView style={[styles.list, { backgroundColor: colors.clear, borderColor: colors.separator }]}>
            {members.map((member, index) => {
              const displayName = member.display_name || member.username || "Circle member";
              const canRemove = ["admin", "manager"].includes(currentUserRole ?? "") && member.role !== "admin";
              const canChangeRole = currentUserRole === "admin" && member.role !== "admin";
              return (
                <View key={member.user_id} style={[styles.row, index < members.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator }]}>
                  {member.avatar_url ? (
                    <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: accent }]}>
                      <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.info}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{displayName}</Text>
                    {member.username && member.display_name ? <Text style={[styles.username, { color: colors.secondary }]}>@{member.username}</Text> : null}
                  </View>
                  <View style={styles.actions}>
                    <Pressable disabled={!canChangeRole} onPress={() => openRoleMenu(member)} style={styles.roleButton}>
                      <Text style={[styles.role, { color: member.role === "admin" ? accent : colors.secondary }]}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Text>
                      {canChangeRole ? <MaterialIcons name="expand-more" size={20} color={colors.secondary} /> : null}
                    </Pressable>
                    {canRemove ? (
                      <Pressable onPress={() => removeMember(member)} style={styles.removeButton}>
                        <Ionicons name="person-remove-outline" size={21} color="#ff3b30" />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </GlassView>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { position: "absolute", top: 72, left: 80, right: 80, textAlign: "center", fontSize: 18, fontWeight: "700", zIndex: 10 },
  content: { paddingHorizontal: 16, paddingTop: 130, paddingBottom: 30 },
  subtitle: { fontSize: 14, marginBottom: 10 },
  list: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { minHeight: 72, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginRight: 12, overflow: "hidden" },
  avatarText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  info: { flex: 1, paddingRight: 8 },
  name: { fontSize: 15, fontWeight: "600" },
  username: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  roleButton: { minHeight: 36, paddingHorizontal: 7, flexDirection: "row", alignItems: "center" },
  role: { fontSize: 13, fontWeight: "600" },
  removeButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
});
