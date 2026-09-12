import DeleteAccount from "@/components/settings/deleteAccount";
import SettingsContainer from "@/components/settings/SettingsContainer";
import SettingsItem from "@/components/settings/SettingsItem";
import SettingsLink from "@/components/settings/SettingsLink";
import { Colors } from "@/styles/colors";
import { useEffect, useState } from "react";
import { Alert, ScrollView, useColorScheme } from "react-native";
import { supabase } from "../utils/supabase";

export default function accountSettings() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  const [email, setEmail] = useState("");

  useEffect(() => {
    const getEmail = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email ?? "");
    };

    getEmail();
  }, []);

  const changeEmail = () => {
    Alert.prompt(
      "Change Email",
      "Enter your new email address.",
      async (newEmail) => {
        if (!newEmail || !newEmail.includes("@")) {
          Alert.alert("Invalid Email", "Please enter a valid email address.");
          return;
        }

        const { error } = await supabase.auth.updateUser({
          email: newEmail.trim(),
        });

        if (error) {
          Alert.alert("Error", error.message);
          return;
        }

        Alert.alert(
          "Check Your Email",
          "We've sent a confirmation link to your new email address.",
        );
      },
      "plain-text",
    );
  };

  const changePassword = () => {
    Alert.prompt(
      "Change Password",
      "Enter your new password.",
      async (newPassword) => {
        if (!newPassword || newPassword.length < 6) {
          Alert.alert(
            "Invalid Password",
            "Your password must be at least 6 characters.",
          );
          return;
        }

        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          Alert.alert("Error", error.message);
          return;
        }

        Alert.alert("Password Changed", "Your password has been updated.");
      },
      "secure-text",
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}
    >
      <SettingsContainer>
        <SettingsItem title="Email" subtitle={email} />

        <SettingsLink
          title="Change Email"
          type="external"
          onPress={changeEmail}
        />

        <SettingsLink
          title="Change Password"
          type="external"
          onPress={changePassword}
        />
      </SettingsContainer>
      <SettingsContainer>
        <DeleteAccount title="Delete Account" />
      </SettingsContainer>
    </ScrollView>
  );
}
