import { Colors } from "@/styles/colors";
import { StyleSheet, TextInput, useColorScheme, View } from "react-native";
import Separator from "../separator";

type ProfileSetupInputProps = {
  displayName: string;
  username: string;
  setDisplayName: (value: string) => void;
  setUsername: (value: string) => void;
  generateUsername: (value: string) => void;
};

export default function ProfileSetupInput({
  displayName,
  username,
  setDisplayName,
  setUsername,
  generateUsername,
}: ProfileSetupInputProps) {
  const theme = useColorScheme() ?? "light";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Colors[theme].login,
          borderColor:
            theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)",
        },
      ]}
    >
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Display name"
        placeholderTextColor={
          theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"
        }
        value={displayName}
        onChangeText={(text) => {
          setDisplayName(text);
          generateUsername(text);
        }}
        autoCapitalize="words"
        autoCorrect={false}
      />

      <View>
        <Separator />
      </View>

      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Username"
        placeholderTextColor={
          theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"
        }
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },

  input: {
    height: 54,
    paddingHorizontal: 20,
    fontSize: 16,
  },
});
