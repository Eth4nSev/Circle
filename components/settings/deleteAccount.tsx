import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";

type SettingsLinkProps = {
  title: string;
};

export default function DeleteAccount({ title }: SettingsLinkProps) {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  const deleteAccount = () => {
    Alert.prompt(
      "Delete Account",
      "Enter your current password to permanently delete your account.",
      async (password) => {
        if (!password) {
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.email) {
          Alert.alert("Error", "Unable to find your account.");
          return;
        }

        const { error: passwordError } = await supabase.auth.signInWithPassword(
          {
            email: user.email,
            password,
          },
        );

        if (passwordError) {
          Alert.alert(
            "Incorrect Password",
            "The password you entered is incorrect.",
          );
          return;
        }

        const { error: deleteError } =
          await supabase.functions.invoke("delete-account");

        if (deleteError) {
          Alert.alert("Error", deleteError.message);
          return;
        }

        await supabase.auth.signOut();
      },
      "secure-text",
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && [
          styles.settingsItemPressed,
          { backgroundColor: colors.cardSelection },
        ],
      ]}
      onPress={() => {
        Alert.alert(
          "Delete Account",
          "This permanently deletes your Circle account and cannot be undone.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue",
              style: "destructive",
              onPress: deleteAccount,
            },
          ],
        );
      }}
    >
      <Text style={{ fontSize: 17, color: "#ff4245" }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  settingsItem: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsItemPressed: {
    opacity: 0.7,
    borderRadius: 20,
  },
  settingsText: {
    fontSize: 17,
  },
  settingsValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  selectedInsideText: {
    color: "#888",
    fontSize: 17,
  },
});
