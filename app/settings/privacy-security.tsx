import SettingsContainer from "@/components/settings/SettingsContainer";
import { Colors } from "@/styles/colors";
import { supabase } from "@/app/utils/supabase";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

export default function PrivacySecurity() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [accountType, setAccountType] = useState<"public" | "private" | null>(
    null,
  );
  const [savingAccountType, setSavingAccountType] = useState(false);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (!hasHardware || !isEnrolled) {
          Alert.alert(
            "Security Error",
            "Face ID or device authentication is not set up on this device.",
          );
          return;
        }

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock Privacy & Security",
          fallbackLabel: "Use Passcode",
          disableDeviceFallback: false,
        });

        if (result.success) {
          setIsUnlocked(true);
        } else {
          Alert.alert(
            "Authentication Failed",
            "Could not verify your identity.",
          );
        }
      } catch (error) {
        console.error("Authentication error:", error);
        Alert.alert(
          "Error",
          "An unexpected error occurred while authenticating.",
        );
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;

    const loadAccountType = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Failed to load account type:", error);
        return;
      }

      setAccountType(data.account_type ?? null);
    };

    loadAccountType();
  }, [isUnlocked]);

  async function changeAccountType(nextType: "public" | "private") {
    if (savingAccountType || nextType === accountType) return;

    setSavingAccountType(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavingAccountType(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ account_type: nextType })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to update account type:", error);
      Alert.alert(
        "Couldn't update account type",
        "Your account type could not be changed.",
      );
    } else {
      setAccountType(nextType);
    }

    setSavingAccountType(false);
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (!isUnlocked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }} />
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
    >
      <SettingsContainer
        title="Account Type"
        subtitle="Public accounts can be viewed without following. Private accounts require follow approval."
      >
        <Pressable
          disabled={savingAccountType}
          onPress={() => changeAccountType("public")}
          style={styles.accountTypeRow}
        >
          <View style={styles.accountTypeText}>
            <Text style={[styles.accountTypeTitle, { color: colors.text }]}>
              Public
            </Text>
            <Text
              style={[
                styles.accountTypeSubtitle,
                { color: colors.secondary },
              ]}
            >
              Anyone can view your posts without following you.
            </Text>
          </View>

          {accountType === "public" ? (
            <Text style={[styles.check, { color: Colors.accent }]}>✓</Text>
          ) : null}
        </Pressable>

        <Pressable
          disabled={savingAccountType}
          onPress={() => changeAccountType("private")}
          style={styles.accountTypeRow}
        >
          <View style={styles.accountTypeText}>
            <Text style={[styles.accountTypeTitle, { color: colors.text }]}>
              Private
            </Text>
            <Text
              style={[
                styles.accountTypeSubtitle,
                { color: colors.secondary },
              ]}
            >
              People must request to follow you before viewing your posts.
            </Text>
          </View>

          {accountType === "private" ? (
            <Text style={[styles.check, { color: Colors.accent }]}>✓</Text>
          ) : null}
        </Pressable>
      </SettingsContainer>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  accountTypeRow: {
    minHeight: 82,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  accountTypeText: {
    flex: 1,
    marginRight: 12,
  },
  accountTypeTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  accountTypeSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  check: {
    fontSize: 22,
    fontWeight: "700",
  },
});
