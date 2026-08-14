import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
	Pressable,
	ScrollView,
	Text,
	useColorScheme,
	View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function Index() {
	const theme = useColorScheme() ?? "light";
	const [posts, setPosts] = useState<any[]>([]);

	useEffect(() => {
		async function getPosts() {
			const { data, error } = await supabase.from("posts").select("*");

			if (error) {
				console.error("Error fetching posts:", error);
				return;
			}

			setPosts(data);
		}

		getPosts();
	}, []);

	return (
		<ScrollView
			style={{ backgroundColor: Colors[theme].background, flex: 1 }}
			contentInsetAdjustmentBehavior="automatic"
		>
			<View style={{ flexDirection: "row", alignItems: "center" }}>
				<GlassView
					style={{
						width: 100,
						height: 40,
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
				<View
					style={{
						flexDirection: "row",
						gap: 20,
						position: "absolute",
						right: 10,
					}}
				>
					<Pressable
						onPress={() => router.push('../login')}
					>
						<Text style={{ color: Colors[theme].text }}>
							Log In
						</Text>
					</Pressable>
					<Pressable
						onPress={async () => {
							await Haptics.selectionAsync();
							await supabase.auth.signOut();
						}}
					>
						<Text style={{ color: Colors[theme].text }}>
							Sign Out
						</Text>
					</Pressable>
				</View>
			</View>
			{posts.map((post) => (
				<PostContainer
					key={post.id}
					href={{ uri: post.image }}
					time={post.created_at}
					author={post.author}
					pfp={{ uri: post.pfp }}
					caption={post.caption}
				/>
			))}
		</ScrollView>
	);
}
