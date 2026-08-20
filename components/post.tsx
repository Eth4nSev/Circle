import { Colors } from "@/styles/colors";
import {
  Entypo,
  FontAwesome,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
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

const iconSize = 30;

function formatRelativeTime(createdAt: string) {
	const timestamp = new Date(createdAt).getTime();
	const elapsedSeconds = Math.max(
		0,
		Math.floor((Date.now() - timestamp) / 1000),
	);

	if (!Number.isFinite(timestamp) || elapsedSeconds < 60) {
		return "now";
	}

	const units = [
		{ seconds: 60 * 60 * 24 * 365, label: "year" },
		{ seconds: 60 * 60 * 24 * 30, label: "month" },
		{ seconds: 60 * 60 * 24 * 7, label: "week" },
		{ seconds: 60 * 60 * 24, label: "day" },
		{ seconds: 60 * 60, label: "hour" },
		{ seconds: 60, label: "minute" },
	];

	const unit = units.find(({ seconds }) => elapsedSeconds >= seconds);

	if (!unit) return "now";

	const value = Math.floor(elapsedSeconds / unit.seconds);

	return `${value} ${unit.label}${value === 1 ? "" : "s"} ago`;
}

type Props = {
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
}: Props) {
	const theme = useColorScheme() ?? "light";
	const [postImageAspectRatio, setPostImageAspectRatio] = useState(1);
	const [isLiked, setIsLiked] = useState(false);

	const likePost = async () => {
		await Haptics.selectionAsync();
		setIsLiked((previous) => !previous);
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
					@{author}
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
					{formatRelativeTime(time)}
				</Text>
			</View>

			<Image
				source={href}
				style={[
					styles.postImage,
					{
						aspectRatio: postImageAspectRatio,
					},
				]}
				resizeMode="contain"
				onLoad={(event) => {
					const { width, height } = event.nativeEvent.source;

					if (width && height) {
						setPostImageAspectRatio(width / height);
					}
				}}
			/>

			<View style={styles.postOptions}>
				<Pressable onPress={likePost}>
					{isLiked ? (
						<View style={styles.likeContainer}>
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

				<Link href="/emojiReact" asChild>
					<Pressable>
						<Entypo
							name="emoji-happy"
							size={iconSize}
							color={Colors[theme].text}
						/>
					</Pressable>
				</Link>

				<View style={styles.morePostOptions}>
					<MaterialIcons
						name="more-horiz"
						size={iconSize}
						color={Colors[theme].text}
					/>
				</View>
			</View>

			{caption ? (
				<Text style={[styles.caption, { color: Colors[theme].text }]}>
					{caption}
				</Text>
			) : null}
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
	likeContainer: {
		flexDirection: "row",
		gap: 5,
		alignItems: "center",
	},
});
