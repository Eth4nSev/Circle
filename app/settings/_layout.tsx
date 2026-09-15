import { Colors } from "@/styles/colors";
import { Entypo } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { Pressable, useColorScheme } from "react-native";

export default function settingsLayout() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="home"
        options={{
          headerTransparent: true,
          headerTitle: "Settings",
          headerTitleStyle: { color: colors.text },
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Entypo
                name="chevron-small-left"
                color={Colors[theme as "light" | "dark"].text}
                size={35}
              />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          headerTransparent: true,
          headerTitle: "Privacy & Security",
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: { color: colors.text },
        }}
      />
      <Stack.Screen
        name="accountSettings"
        options={{
          headerTransparent: true,
          headerTitle: "Account",
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: { color: colors.text },
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          headerTransparent: true,
          headerTitle: "Appearance",
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: { color: colors.text },
        }}
      />
      <Stack.Screen
        name="circlesSettings"
        options={{
          headerTransparent: true,
          headerTitle: "Circles",
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: { color: colors.text },
        }}
      />
    </Stack>
  );
}
