import { supabase } from "@/app/utils/supabase";
import Back from "@/components/Back";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, useColorScheme, View } from "react-native";
import { useAccent } from "./context/accent";

type Circle = { id: string; name: string; chat_enabled: boolean };
type Role = "admin" | "manager" | "member";

export default function CircleSettings() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const { accent } = useAccent();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingChat, setSavingChat] = useState(false);

  const loadSettings = async () => {
    if (!circleId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const [{ data: circleData, error: circleError }, { data: memberData }] = await Promise.all([
      supabase.from("circles").select("id, name, chat_enabled").eq("id", circleId).single(),
      supabase.from("circle_members").select("role").eq("circle_id", circleId).eq("user_id", user.id).single(),
    ]);

    if (circleError || !circleData || !memberData) {
      router.back();
      return;
    }

    setCircle(circleData);
    setChatEnabled(circleData.chat_enabled);
    setRole(memberData.role);
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, [circleId]);

  const updateChat = async (enabled: boolean) => {
    if (!circle || role !== "admin" || savingChat) return;
    setSavingChat(true);
    const { error } = await supabase.from("circles").update({ chat_enabled: enabled }).eq("id", circle.id);
    if (error) {
      console.error("Error updating Circle chat:", error);
      Alert.alert("Error", "Circle Chat could not be updated.");
      setSavingChat(false);
      return;
    }
    setChatEnabled(enabled);
    setSavingChat(false);
  };

  const leaveCircle = () => {
    if (!circle) return;
    if (role === "admin") {
      Alert.alert("Admin can't leave", "Transfer the admin role to another member before leaving this Circle.");
      return;
    }

    Alert.alert("Leave Circle", `Are you sure you want to leave “${circle.name}”?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          const { error } = await supabase.from("circle_members").delete().eq("circle_id", circle.id).eq("user_id", user.id);
          if (error) {
            console.error("Error leaving Circle:", error);
            Alert.alert("Error", "You could not leave this Circle.");
            return;
          }
          router.replace("/(tabs)/circles");
        },
      },
    ]);
  };

  const deleteCircle = () => {
    if (!circle || role !== "admin") return;
    Alert.alert("Delete Circle", `Delete “${circle.name}”? This permanently removes the Circle and its members.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.from("circles").delete().eq("id", circle.id);
          if (error) {
            console.error("Error deleting Circle:", error);
            Alert.alert("Error", "The Circle could not be deleted.");
            return;
          }
          router.replace("/(tabs)/circles");
        },
      },
    ]);
  };

  if (loading) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator /></View>;
  if (!circle) return null;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Back />
        <Text style={[styles.title, { color: colors.text }]}>Circle Settings</Text>
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Section title="Chat">
            <View style={[styles.row, { borderColor: colors.separator }]}>
              <View style={styles.icon}><Ionicons name="chatbubble-outline" size={21} color={colors.text} /></View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Circle Chat</Text>
                <Text style={[styles.rowSubtitle, { color: colors.secondary }]}>
                  {role === "admin" ? "Allow members to use the Circle group chat" : "Only the Circle admin can change this"}
                </Text>
              </View>
              <Switch value={chatEnabled} disabled={role !== "admin" || savingChat} onValueChange={updateChat} trackColor={{ true: accent }} />
            </View>
          </Section>

          <Section title="Membership">
            <Pressable onPress={leaveCircle} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
              <View style={styles.icon}><Ionicons name="exit-outline" size={21} color={colors.text} /></View>
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Leave Circle</Text>
                <Text style={[styles.rowSubtitle, { color: colors.secondary }]}>Remove yourself from {circle.name}</Text>
              </View>
            </Pressable>
          </Section>

          {role === "admin" ? (
            <Section title="Danger Zone">
              <Pressable onPress={deleteCircle} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                <View style={styles.icon}><Ionicons name="trash-outline" size={21} color="#ff3b30" /></View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowTitle, { color: "#ff3b30" }]}>Delete Circle</Text>
                  <Text style={[styles.rowSubtitle, { color: colors.secondary }]}>Permanently delete this Circle and its members</Text>
                </View>
              </Pressable>
            </Section>
          ) : null}
        </ScrollView>
      </View>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.secondary }]}>{title}</Text>
      <GlassView style={[styles.sectionContainer, { backgroundColor: colors.clear, borderColor: colors.separator }]}>
        {children}
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { position: "absolute", top: 72, left: 70, right: 70, textAlign: "center", fontSize: 18, fontWeight: "700", zIndex: 10 },
  content: { paddingHorizontal: 16, paddingTop: 125, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginLeft: 4, textTransform: "uppercase" },
  sectionContainer: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row: { minHeight: 74, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, marginTop: 3, lineHeight: 17 },
});
