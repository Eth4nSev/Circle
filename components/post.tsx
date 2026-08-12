import { Colors } from "@/styles/colors";
import {
  Entypo,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

const iconSize: number = 30;

type props = {
	author: string;
	time: string;
	href: ImageSourcePropType;
	pfp: ImageSourcePropType;
	caption?: string;
};

export default function PostContainer({
	author,
	time,
	href,
	caption,
	pfp,
}: props) {
	const theme = useColorScheme() ?? "light";
	const postImageSource = href;
	const postImageAspectRatio =
		Image.resolveAssetSource(postImageSource).width /
		Image.resolveAssetSource(postImageSource).height;
	const [isLiked, notLiked] = useState(false);

	const likePost = async () => {
		await Haptics.selectionAsync();
		notLiked(!isLiked);
	};

	return (
		<GlassView style={styles.postContainer}>
			<View style={styles.postAccount}>
				<Image source={pfp} style={styles.pfp} />
				<Text
					style={[
						styles.postAccountName,
						{ color: Colors[theme].text },
					]}
				>
					{author}
				</Text>
				<Text style={{ color: Colors[theme].secondary }}>
					{"\u2022"}
				</Text>
				<Text
					style={[
						styles.timeStamp,
						{ color: Colors[theme].secondary },
					]}
				>
					{time}
				</Text>
			</View>
			<Image
				source={postImageSource}
				style={[
					styles.postImage,
					{ aspectRatio: postImageAspectRatio },
				]}
				resizeMode="contain"
			/>
			<View style={styles.postOptions}>
				<Pressable onPress={likePost}>
					{isLiked ? (
						<View
							style={{
								flexDirection: "row",
								gap: 5,
								alignItems: "center",
							}}
						>
							<FontAwesome
								name="thumbs-up"
								size={iconSize}
								color={Colors[theme].text}
							/>
							<Text
								style={{
									color: Colors[theme].text,
									fontSize: 20,
									fontWeight: "bold",
								}}
							>
								1
							</Text>
						</View>
					) : (
						<FontAwesome
							name="thumbs-o-up"
							size={iconSize}
							color={Colors[theme].text}
						/>
					)}
				</Pressable>
				<Ionicons
					name="chatbubble-outline"
					size={iconSize}
					color={Colors[theme].text}
				/>
				<Entypo
					name="emoji-happy"
					size={iconSize}
					color={Colors[theme].text}
				/>
				<View style={styles.morePostOptions}>
					<MaterialIcons
						name="more-horiz"
						size={iconSize}
						color={Colors[theme].text}
					/>
				</View>
			</View>
			<Text style={[styles.caption, { color: Colors[theme].text }]}>
				{caption}
			</Text>
		</GlassView>
	);
}

const styles = StyleSheet.create({
	postContainer: {
		padding: 15,
		borderRadius: 10,
		justifyContent: "center",
		marginHorizontal: 10,
		marginVertical: 10,
	},
	postImage: {
		width: 350,
		height: undefined,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: "#000",
		borderRadius: 5,
	},
	postOptions: {
		flexDirection: "row",
		gap: 20,
		marginTop: 10,
	},
	morePostOptions: {
		position: "absolute",
		right: 0,
	},
	pfp: {
		width: 30,
		height: 30,
		borderRadius: 30,
	},
	postAccount: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 10,
		gap: 5,
	},
	postAccountName: {
		fontSize: 16,
		fontWeight: "bold",
	},
	timeStamp: {
		fontSize: 12,
	},
	caption: {
		marginTop: 10,
	},
});
