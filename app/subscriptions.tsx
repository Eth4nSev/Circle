import { Colors } from "@/styles/colors";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useAccent } from "./context/accent";
const { accent } = useAccent();

export default function subscriptions() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];

	return (
		<>
			<ScrollView
				style={[
					styles.container,
					{
						backgroundColor: colors.background,
					},
				]}
			>
				<View style={styles.header}>
					<View>
						<Text style={[styles.title, { color: colors.text }]}>
							Circle+
						</Text>
						<Text
							style={[
								styles.subtitle,
								{ color: colors.secondary },
							]}
						>
							Get more out of Circle
						</Text>
					</View>
				</View>

				<View style={styles.plans}>
					<View
						style={[
							styles.plan,
							{
								backgroundColor: colors.clear,
								borderColor: colors.separator,
							},
						]}
					>
						<View style={styles.planHeader}>
							<View>
								<View style={styles.nameRow}>
									<Text
										style={[
											styles.planName,
											{ color: colors.text },
										]}
									>
										Circle Max
									</Text>

									<View
										style={[
											styles.maxBadge,
											{ backgroundColor: colors.text },
										]}
									>
										<Text
											style={[
												styles.maxBadgeText,
												{ color: colors.background },
											]}
										>
											MAX
										</Text>
									</View>
								</View>

								<Text
									style={[
										styles.planPrice,
										{ color: colors.text },
									]}
								>
									$9.99
									<Text style={styles.month}>/month</Text>
								</Text>
							</View>

							<Ionicons name="diamond" size={27} color={accent} />
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								Everything in Circle+
							</Text>
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								AI-powered creative tools
							</Text>
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								AI image editing
							</Text>
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								Future AI features
							</Text>
						</View>

						<GlassView tintColor={accent} style={styles.maxButton}>
							<Pressable>
								<Text style={styles.upgradeText}>
									Upgrade to Circle Max
								</Text>
							</Pressable>
						</GlassView>
					</View>

					<GlassView tintColor={accent} style={styles.featuredPlan}>
						<View style={styles.planHeader}>
							<View>
								<View style={styles.nameRow}>
									<Text style={styles.featuredName}>
										Circle+
									</Text>

									<View style={styles.badge}>
										<Text style={styles.badgeText}>
											POPULAR
										</Text>
									</View>
								</View>

								<Text style={styles.featuredPrice}>
									$3.99
									<Text style={styles.month}>/month</Text>
								</Text>
							</View>

							<Ionicons name="sparkles" size={28} color="#fff" />
						</View>

						<PlanFeature text="Everything in Free" light />
						<PlanFeature
							text="Full premium filters and effects"
							light
						/>
						<PlanFeature text="Advanced editing tools" light />
						<PlanFeature text="No ads" light />

						<Pressable style={styles.upgradeButton}>
							<Text style={styles.upgradeText}>
								Upgrade to Circle+
							</Text>
						</Pressable>
					</GlassView>

					<View
						style={[
							styles.plan,
							{
								backgroundColor: colors.clear,
								borderColor: colors.separator,
							},
						]}
					>
						<View style={styles.planHeader}>
							<View>
								<Text
									style={[
										styles.planName,
										{ color: colors.text },
									]}
								>
									Circle Free
								</Text>
								<Text
									style={[
										styles.planPrice,
										{ color: colors.secondary },
									]}
								>
									$0
								</Text>
							</View>

							<Ionicons
								name="checkmark-circle"
								size={28}
								color={accent}
							/>
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								Posts and Circles
							</Text>
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								Comments and reactions
							</Text>
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								Basic editing tools
							</Text>
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								Privacy features
							</Text>
						</View>

						<View style={styles.feature}>
							<Ionicons
								name="checkmark"
								size={18}
								color={accent}
							/>
							<Text
								style={[
									styles.featureText,
									{ color: colors.text },
								]}
							>
								Ads
							</Text>
						</View>
					</View>
				</View>

				<Text style={[styles.footer, { color: colors.secondary }]}>
					Circle is free to use. Subscriptions only unlock optional
					premium features. Circle does contain ads.
				</Text>
			</ScrollView>
			<GlassView style={styles.closeButton} isInteractive>
				<Pressable
					onPress={() => router.back()}
					style={styles.closePressable}
				>
					<MaterialIcons name="close" size={26} color={colors.text} />
				</Pressable>
			</GlassView>
		</>
	);
}

function PlanFeature({
	text,
	light = false,
}: {
	text: string;
	light?: boolean;
}) {
	return (
		<View style={styles.feature}>
			<Ionicons
				name="checkmark"
				size={18}
				color={light ? "#fff" : accent}
			/>

			<Text
				style={[
					styles.featureText,
					{ color: light ? "#fff" : undefined },
				]}
			>
				{text}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 20,
	},

	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 20,
	},

	title: {
		fontSize: 28,
		fontWeight: "700",
	},

	subtitle: {
		fontSize: 14,
		marginTop: 3,
	},

	closeButton: {
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		right: 20,
		top: 20,
	},

	closePressable: {
		width: 50,
		height: 50,
		alignItems: "center",
		justifyContent: "center",
	},

	plans: {
		gap: 14,
	},

	plan: {
		borderWidth: StyleSheet.hairlineWidth,
		borderRadius: 24,
		padding: 18,
	},

	featuredPlan: {
		borderRadius: 24,
		padding: 18,
	},

	planHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 14,
	},

	nameRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},

	planName: {
		fontSize: 20,
		fontWeight: "700",
	},

	featuredName: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "700",
	},

	planPrice: {
		fontSize: 18,
		fontWeight: "600",
		marginTop: 2,
	},

	featuredPrice: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "700",
		marginTop: 2,
	},

	month: {
		fontSize: 13,
		fontWeight: "500",
	},

	badge: {
		paddingHorizontal: 7,
		paddingVertical: 3,
		borderRadius: 8,
		backgroundColor: "rgba(255,255,255,0.25)",
	},

	badgeText: {
		color: "#fff",
		fontSize: 9,
		fontWeight: "800",
	},

	maxBadge: {
		paddingHorizontal: 7,
		paddingVertical: 3,
		borderRadius: 8,
	},

	maxBadgeText: {
		fontSize: 9,
		fontWeight: "800",
	},

	feature: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 9,
	},

	featureText: {
		fontSize: 14,
	},

	upgradeButton: {
		height: 46,
		borderRadius: 23,
		backgroundColor: "rgba(255,255,255,0.22)",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 16,
	},

	maxButton: {
		height: 46,
		borderRadius: 23,
		alignItems: "center",
		justifyContent: "center",
		marginTop: 16,
	},

	upgradeText: {
		color: "#fff",
		fontSize: 15,
		fontWeight: "700",
	},

	footer: {
		textAlign: "center",
		fontSize: 12,
		lineHeight: 18,
		marginTop: 18,
		marginHorizontal: 15,
		opacity: 0.6,
		marginBottom: 18,
	},
});
