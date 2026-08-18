import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function AppleButton() {
	return (
		<Pressable
			style={styles.appleButtonContainer}
			onPress={() => Haptics.selectionAsync()}
		>
			<GlassView
				tintColor="#000"
				style={styles.appleButton}
				isInteractive
			>
				<View style={styles.innerAppleButton}>
					<Ionicons name="logo-apple" size={21} color="#fff" />

					<Text style={styles.appleText}>Sign in with Apple</Text>
				</View>
			</GlassView>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	appleButtonContainer: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	appleButton: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	innerAppleButton: {
		flexDirection: "row",
		gap: 9,
	},
	appleText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "600",
	},
});
