import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "@/styles/colors";
import { useAccent } from "../context/accent";

type TabIconName = keyof typeof Ionicons.glyphMap;

export default function TabLayout() {
  const { accent } = useAccent();
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  const icon = (name: TabIconName, focusedName: TabIconName) =>
    ({ color, focused }: { color: string; focused: boolean }) => (
      <Ionicons
        name={focused ? focusedName : name}
        size={24}
        color={focused ? accent : color}
      />
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.secondary,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home-outline", "home") }} />
      <Tabs.Screen name="circles" options={{ title: "Circles", tabBarIcon: icon("ellipse-outline", "ellipse") }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: icon("search-outline", "search") }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: icon("person-outline", "person") }} />
    </Tabs>
  );
}
