import { Colors } from "@/styles/colors";
import { GlassView } from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";

export default function GoogleButton() {
	const theme = useColorScheme() ?? "light";

	return (
		<Pressable
			style={styles.googleButtonContainer}
			onPress={() => Haptics.selectionAsync()}
		>
			<GlassView
				tintColor={Colors[theme].google}
				style={styles.googleButton}
				isInteractive
			>
				<View style={styles.innerGoogleButton}>
					<Image
						source={require("@/assets/images/g-logo.png")}
						style={styles.googleLogo}
					/>

					<Text
						style={[
							styles.googleText,
							{ color: Colors[theme].googleText },
						]}
					>
						Sign in with Google
					</Text>
				</View>
			</GlassView>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	googleButtonContainer: {
		marginTop: 10,
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	googleButton: {
		width: "100%",
		height: 52,
		borderRadius: 30,
		alignItems: "center",
		justifyContent: "center",
	},
	innerGoogleButton: {
		flexDirection: "row",
		gap: 9,
	},
	googleText: {
		fontSize: 17,
		fontWeight: "600",
	},
	googleLogo: {
		width: 20,
		height: 20,
	},
});
