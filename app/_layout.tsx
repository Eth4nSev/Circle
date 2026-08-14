import { Colors } from "@/styles/colors";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";

export default function RootLayout() {
	const theme = useColorScheme() ?? "light";

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name="modal"
				options={{
					presentation: "formSheet",
					sheetGrabberVisible: true,
					sheetAllowedDetents: [0.15, 1],
					contentStyle: {
						backgroundColor: isLiquidGlassAvailable()
							? "transparent"
							: Colors[theme].background,
					},
				}}
			/>
			<Stack.Screen
				name="emoji-react"
				options={{
					presentation: "formSheet",
					sheetGrabberVisible: true,
					sheetAllowedDetents: [0.15, 1],
					contentStyle: {
						backgroundColor: isLiquidGlassAvailable()
							? "transparent"
							: Colors[theme].background,
					},
				}}
			/>
		</Stack>
	);
}
