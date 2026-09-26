import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native";

const features = [
	{
		icon: "people-outline" as const,
		title: "Circles",
		description:
			"Organize the people you care about into private, intentional groups.",
	},
	{
		icon: "create-outline" as const,
		title: "Better posts",
		description:
			"More control over comments, sharing, and emoji reactions.",
	},
	{
		icon: "sparkles-outline" as const,
		title: "A new Circle experience",
		description:
			"A cleaner social experience built around the people you choose.",
	},
];

export default function BetaWelcome() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];

	const [loading, setLoading] = useState(false);

	const handleContinue = async () => {
		if (loading) return;

		setLoading(true);

		try {
			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (!user) {
				router.dismiss();
				return;
			}

			const { error } = await supabase
				.from("profiles")
				.update({ updated: false })
				.eq("id", user.id);

			if (error) {
				console.error("Failed to update beta status:", error);
				return;
			}

			router.dismiss();
		} catch (error) {
			console.error("Failed to close Beta Welcome:", error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: colors.background,
				},
			]}
		>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.header}>
					<View
						style={[
							styles.badge,
							{
								backgroundColor: `${Colors.accent}18`,
							},
						]}
					>
						<Text
							style={[
								styles.badgeText,
								{
									color: Colors.accent,
								},
							]}
						>
							CIRCLE BETA 1
						</Text>
					</View>

					<Text
						style={[
							styles.title,
							{
								color: colors.text,
							},
						]}
					>
						Welcome to Circle
					</Text>

					<Text
						style={[
							styles.subtitle,
							{
								color: colors.secondary,
							},
						]}
					>
						Here's what's new in Beta 1.
					</Text>
				</View>

				<View style={styles.features}>
					{features.map((feature) => (
						<View key={feature.title} style={styles.feature}>
							<View
								style={[
									styles.icon,
									{
										backgroundColor: `${Colors.accent}18`,
									},
								]}
							>
								<Ionicons
									name={feature.icon}
									size={23}
									color={Colors.accent}
								/>
							</View>

							<View style={styles.featureText}>
								<Text
									style={[
										styles.featureTitle,
										{
											color: colors.text,
										},
									]}
								>
									{feature.title}
								</Text>

								<Text
									style={[
										styles.featureDescription,
										{
											color: colors.secondary,
										},
									]}
								>
									{feature.description}
								</Text>
							</View>
						</View>
					))}
				</View>
			</ScrollView>

			<View
				style={[
					styles.footer,
					{
						backgroundColor: colors.background,
					},
				]}
			>
				<Pressable
					onPress={handleContinue}
					disabled={loading}
					style={({ pressed }) => [
						styles.button,
						{
							backgroundColor: Colors.accent,
							opacity: pressed || loading ? 0.7 : 1,
						},
					]}
				>
					{loading ? (
						<ActivityIndicator color="#fff" />
					) : (
						<Text style={styles.buttonText}>Continue</Text>
					)}
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 24,
		paddingTop: 30,
		paddingBottom: 32,
	},
	header: {
		alignItems: "center",
		paddingBottom: 38,
	},
	badge: {
		paddingHorizontal: 11,
		paddingVertical: 6,
		borderRadius: 20,
		marginBottom: 17,
	},
	badgeText: {
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1,
	},
	title: {
		fontSize: 30,
		fontWeight: "700",
		letterSpacing: -0.7,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		lineHeight: 22,
		textAlign: "center",
		marginTop: 8,
	},
	features: {
		gap: 26,
	},
	feature: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: 16,
	},
	icon: {
		width: 50,
		height: 50,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	featureText: {
		flex: 1,
		paddingTop: 2,
	},
	featureTitle: {
		fontSize: 17,
		fontWeight: "600",
		marginBottom: 4,
	},
	featureDescription: {
		fontSize: 15,
		lineHeight: 21,
	},
	footer: {
		paddingHorizontal: 24,
		paddingTop: 12,
		paddingBottom: 24,
	},
	button: {
		height: 52,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#fff",
		fontSize: 17,
		fontWeight: "600",
	},
});
