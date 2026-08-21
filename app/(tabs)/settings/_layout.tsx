import { Stack } from "expo-router";

export default function settingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerTransparent: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="home"
        options={{
          title: "Settings",
          headerTransparent: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="privacy-security"
        options={{
          title: "Privacy & Security",
          headerTransparent: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}
