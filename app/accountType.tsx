import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { GlassView } from "expo-glass-effect";
import { supabase } from "./utils/supabase";

type AccountType = "public" | "private";

export default function AccountTypeScreen() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const backgroundImage =
    theme === "dark"
      ? require("@/assets/images/loginbackground-dark.png")
      : require("@/assets/images/loginbackground-light.png");

  const [saving, setSaving] = useState<AccountType | null>(null);

  async function chooseAccountType(accountType: AccountType) {
    if (saving) return;

    await Haptics.selectionAsync();
    setSaving(accountType);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(null);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ account_type: accountType })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to save account type:", error);
      setSaving(null);
      return;
    }

    router.replace("/");
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <ImageBackground
        source={backgroundImage}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>
              Choose your account type
            </Text>

            <Text style={[styles.subtitle, { color: colors.secondary }]}>
              You can change this later in Privacy & Security.
            </Text>

            <View style={styles.options}>
              <Pressable
                disabled={!!saving}
                onPress={() => chooseAccountType("public")}
                style={({ pressed }) => [
                  styles.option,
                  { opacity: pressed || saving === "public" ? 0.7 : 1 },
                ]}
              >
                <GlassView
                  tintColor={Colors.accent}
                  style={styles.optionGlass}
                  isInteractive
                >
                  <View style={styles.icon}>
                    {saving === "public" ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Ionicons name="globe-outline" size={30} color="#fff" />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={styles.optionTitle}>Public</Text>
                    <Text style={styles.optionDescription}>
                      Anyone can follow you and view your posts without
                      following you.
                    </Text>
                  </View>
                </GlassView>
              </Pressable>

              <Pressable
                disabled={!!saving}
                onPress={() => chooseAccountType("private")}
                style={({ pressed }) => [
                  styles.option,
                  { opacity: pressed || saving === "private" ? 0.7 : 1 },
                ]}
              >
                <GlassView
                  tintColor={colors.separator}
                  style={styles.optionGlass}
                  isInteractive
                >
                  <View style={styles.icon}>
                    {saving === "private" ? (
                      <ActivityIndicator color={colors.text} />
                    ) : (
                      <Ionicons
                        name="lock-closed-outline"
                        size={30}
                        color={colors.text}
                      />
                    )}
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>
                      Private
                    </Text>
                    <Text
                      style={[
                        styles.optionDescription,
                        { color: colors.secondary },
                      ]}
                    >
                      People must request to follow you, and only approved
                      followers can view your posts.
                    </Text>
                  </View>
                </GlassView>
              </Pressable>
            </View>
          </View>
        </View>
      </ImageBackground>
    </>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  options: {
    gap: 14,
  },

  option: {
    width: "100%",
  },

  optionGlass: {
    minHeight: 112,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  icon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    flex: 1,
    gap: 5,
  },

  optionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  optionDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 20,
  },
});
