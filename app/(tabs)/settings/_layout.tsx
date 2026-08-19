import { Stack } from "expo-router";

export default function settingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerTransparent: true,
          headerBackTitle: "",
        }}
      />
      <Stack.Screen
        name="home"
        options={{
          title: "Settings",
          headerTransparent: true,
          headerBackTitle: "",
        }}
      />
    </Stack>
  );
}
