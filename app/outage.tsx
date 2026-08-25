import { Colors } from "@/styles/colors";
import { Image, StyleSheet, Text, useColorScheme, View } from "react-native";

export default function OutageScreen() {
	const theme = useColorScheme() ?? "dark";
	const colors = Colors[theme];

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: OutageColors[theme].background },
			]}
		>
			<View style={styles.content}>
				<View
					style={[
						styles.logoPlaceholder,
						{ borderColor: Colors.accent },
					]}
				>
					{useColorScheme() === "light" ? (
						<Image
							source={require("@/assets/images/icon.png")}
							style={{ width: 150, height: 150 }}
						/>
					) : (
						<Image
							source={require("@/assets/images/dark-icon.png")}
							style={{ width: 150, height: 150 }}
						/>
					)}
				</View>

				<Text style={[styles.title, { color: colors.text }]}>
					Circle is temporarily down
				</Text>

				<Text style={[styles.description, { color: colors.secondary }]}>
					We're having trouble connecting to Circle's servers right
					now. Please try again later.
				</Text>

				{/* <View style={styles.articlesPlaceholder}>
					<Text
						style={[styles.articlesTitle, { color: colors.text }]}
					>
						Circle News
					</Text>

					<Text
						style={[
							styles.articlesText,
							{ color: colors.secondary },
						]}
					>
						Product updates and announcements will appear here.
					</Text>
				</View> */}
			</View>
		</View>
	);
}

export const OutageColors = {
	light: {
		background: "#fdfdfc",
	},
	dark: {
		background: "#000",
	},
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 28,
	},
	content: {
		width: "100%",
		alignItems: "center",
	},
	logoPlaceholder: {
		width: 88,
		height: 88,
		borderRadius: 24,
		borderWidth: 2,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 28,
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		textAlign: "center",
		letterSpacing: -0.5,
	},
	description: {
		fontSize: 16,
		lineHeight: 23,
		textAlign: "center",
		maxWidth: 360,
		marginTop: 12,
	},
	statusContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 11,
		borderRadius: 20,
		marginTop: 24,
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#ff453a",
		marginRight: 9,
	},
	statusText: {
		fontSize: 14,
		fontWeight: "600",
	},
	articlesPlaceholder: {
		width: "100%",
		marginTop: 42,
	},
	articlesTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginBottom: 6,
	},
	articlesText: {
		fontSize: 14,
		lineHeight: 20,
	},
	footer: {
		position: "absolute",
		bottom: 35,
		fontSize: 13,
	},
});
