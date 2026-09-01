import { Colors } from "@/styles/colors";
import {
  ScrollView,
  Text,
  useColorScheme
} from "react-native";

export default function Index() {
	const theme = useColorScheme() ?? "light";

	return (
		<ScrollView
			style={{ backgroundColor: Colors[theme].background }}
			contentInsetAdjustmentBehavior="automatic"
		>
			<Text style={{ color: Colors[theme].text }}>Circles Page</Text>
		</ScrollView>
	);
}
