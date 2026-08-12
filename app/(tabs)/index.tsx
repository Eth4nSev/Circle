import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { GlassView } from "expo-glass-effect";
import { ScrollView, Text, useColorScheme } from "react-native";

export default function Index() {
	const theme = useColorScheme() ?? "light";

	return (
		<ScrollView
			style={{ backgroundColor: Colors[theme].background, flex: 1 }}
		>
			<GlassView
				style={{
					width: 100,
					paddingVertical: 5,
					justifyContent: "center",
					alignItems: "center",
					margin: 10,
					borderRadius: 20,
				}}
				isInteractive
			>
				<Text
					style={{
						color: Colors[theme].text,
						fontWeight: "bold",
						fontSize: 20,
					}}
				>
					Home
				</Text>
			</GlassView>
			<PostContainer
				href={require("@/assets/images/kitty.jpg")}
				time="Now"
				author="Admin"
				pfp={require("@/assets/images/admin.png")}
				caption="Kitty"
			/>
			<PostContainer
				href={require("@/assets/images/circle.png")}
				time="5 minutes ago"
				author="Eth4nSev"
				pfp={require("@/assets/images/pfp.png")}
				caption="We are here"
			/>
		</ScrollView>
	);
}
