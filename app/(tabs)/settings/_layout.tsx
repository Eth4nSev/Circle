import { Stack } from "expo-router";

export default function settingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="home"
        options={{
          title: "Settings",
          headerTransparent: true,
          headerShadowVisible: true,
          headerTintColor: undefined,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          title: "Privacy & Security",
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}
