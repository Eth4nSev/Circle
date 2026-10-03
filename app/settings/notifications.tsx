import SettingsContainer from "@/components/settings/SettingsContainer";
import { Colors } from "@/styles/colors";
import { useEffect, useState } from "react";
import { ScrollView, Switch, Text, useColorScheme, View } from "react-native";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  syncPushNotifications,
  type NotificationPreferences,
} from "../utils/notifications";
import { supabase } from "../utils/supabase";

type SettingKey = keyof Omit<NotificationPreferences, "pushEnabled">;

const notificationSettings: Array<{
	key: SettingKey;
	title: string;
	subtitle: string;
}> = [
	{
		key: "directMessages",
		title: "Direct Messages",
		subtitle: "When you receive a new DM.",
	},
	{
		key: "circleInvites",
		title: "Circle Invites",
		subtitle: "When someone invites you to a Circle.",
	},
	{
		key: "likes",
		title: "Likes",
		subtitle: "When someone likes your post.",
	},
	{
		key: "comments",
		title: "Comments",
		subtitle: "When someone comments on your post.",
	},
	{
		key: "followRequests",
		title: "Follow Requests",
		subtitle: "When someone requests to follow you.",
	},
];

export default function NotificationsSettings() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];

	const [preferences, setPreferences] =
		useState<NotificationPreferences | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		loadNotificationPreferences().then(setPreferences);
	}, []);

	async function updatePreference(
		key: keyof NotificationPreferences,
		value: boolean,
	) {
		if (!preferences || saving) return;

		const next = {
			...preferences,
			[key]: value,
		};

		setPreferences(next);
		setSaving(true);

		try {
			await saveNotificationPreferences(next);

			const {
				data: { user },
			} = await supabase.auth.getUser();

			if (user) {
				await syncPushNotifications(user.id, next);
			}
		} finally {
			setSaving(false);
		}
	}

	if (!preferences) {
		return (
			<View
				style={[
					styles.loading,
					{
						backgroundColor: colors.background,
					},
				]}
			/>
		);
	}

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			style={{ backgroundColor: colors.background }}
		>
			<SettingsContainer
				title="Push Notifications"
				subtitle="Notification history stays on this device for 30 days."
			>
				{notificationSettings.map((item) => (
					<View key={item.key} style={styles.row}>
						<View style={styles.rowText}>
							<Text
								style={[styles.title, { color: colors.text }]}
							>
								{item.title}
							</Text>
							<Text
								style={[
									styles.subtitle,
									{ color: colors.secondary },
								]}
							>
								{item.subtitle}
							</Text>
						</View>

						<Switch
							value={preferences[item.key]}
							onValueChange={(value) =>
								updatePreference(item.key, value)
							}
							trackColor={{ true: Colors.accent }}
							disabled={saving}
						/>
					</View>
				))}
			</SettingsContainer>
		</ScrollView>
	);
}

const styles = {
	loading: {
		flex: 1,
	},
	row: {
		minHeight: 68,
		paddingHorizontal: 16,
		paddingVertical: 13,
		flexDirection: "row" as const,
		alignItems: "center" as const,
		gap: 12,
	},
	rowText: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: "600" as const,
	},
	subtitle: {
		fontSize: 13,
		lineHeight: 18,
		marginTop: 3,
	},
	systemRow: {
		minHeight: 68,
		padding: 16,
		flexDirection: "row" as const,
		alignItems: "center" as const,
		gap: 12,
	},
	systemSettingsButton: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	settingsButtonContainer: {
		alignItems: "center" as const,
		paddingVertical: 22,
	},
	openSettings: {
		fontSize: 15,
		fontWeight: "600" as const,
	},
};
