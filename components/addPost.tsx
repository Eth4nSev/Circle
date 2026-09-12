import { useAccent } from "@/app/context/accent";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { Pressable, StyleProp, ViewStyle } from "react-native";

type props = {
	href: string;
	style?: StyleProp<ViewStyle>;
};

export default function AddPost({ href, style }: props) {
	const { accent } = useAccent();

	return (
		<Pressable onPress={() => router.push(href as any)}>
			<GlassView
				style={[
					{
						width: 80,
						height: 80,
						borderRadius: 80,
						justifyContent: "center",
						alignItems: "center",
					},
					style,
				]}
				isInteractive
			>
				<Ionicons name="add" size={50} color={accent} />
			</GlassView>
		</Pressable>
	);
}
