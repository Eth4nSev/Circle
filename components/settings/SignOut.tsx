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

export default function SignOut({ title }: SettingsLinkProps) {
  const theme = useColorScheme() ?? "light";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && [
          styles.settingsItemPressed,
          { backgroundColor: Colors[theme as "light" | "dark"].cardSelection },
        ],
      ]}
      onPress={() => {
        Alert.alert("Sign out", "Are you sure you want to sign out?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign out",
            style: "destructive",
            onPress: async () => {
              await supabase.auth.signOut();
            },
          },
        ]);
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
