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
								size={45}
							/>
						</Pressable>
					),
				}}
			/>
		</Stack>
	);
}
