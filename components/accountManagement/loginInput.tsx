import { Colors } from "@/styles/colors";
import { StyleSheet, TextInput, useColorScheme, View } from "react-native";
import Separator from "../separator";

type LoginInputProps = {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
};

export default function LoginInput({
  email,
  password,
  setEmail,
  setPassword,
}: LoginInputProps) {
  const theme = useColorScheme() ?? "light";

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Colors[theme].login,
          borderColor: Colors[theme].separator,
        },
      ]}
    >
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Email"
        placeholderTextColor={
          theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"
        }
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
      />

      <View>
        <Separator />
      </View>

      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Password"
        placeholderTextColor={
          theme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)"
        }
        value={password}
        onChangeText={setPassword}
        autoComplete="password"
        textContentType="password"
        secureTextEntry
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
