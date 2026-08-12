import { Colors } from "@/styles/colors";
import { Text, useColorScheme, View } from "react-native";

export default function Index() {
	const theme = useColorScheme() ?? "light";

	return (
		<View
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: Colors[theme].background,
			}}
		>
			<Text style={{ color: Colors[theme].text }}>Profile Screen</Text>
		</View>
	);
}
