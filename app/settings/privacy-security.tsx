import SettingsContainer from "@/components/settings/SettingsContainer";
import SettingsItem from "@/components/settings/SettingsItem";
import { Colors } from "@/styles/colors";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  useColorScheme,
  View,
} from "react-native";

export default function PrivacySecurity() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];

	const [loading, setLoading] = useState(true);
	const [isUnlocked, setIsUnlocked] = useState(false);

	useEffect(() => {
		const authenticateUser = async () => {
			try {
				const hasHardware =
					await LocalAuthentication.hasHardwareAsync();

				const isEnrolled = await LocalAuthentication.isEnrolledAsync();

				if (!hasHardware || !isEnrolled) {
					Alert.alert(
						"Security Error",
						"Face ID or device authentication is not set up on this device.",
					);
					return;
				}

				const result = await LocalAuthentication.authenticateAsync({
					promptMessage: "Unlock Privacy & Security",
					fallbackLabel: "Use Passcode",
					disableDeviceFallback: false,
				});

				if (result.success) {
					setIsUnlocked(true);
				} else {
					Alert.alert(
						"Authentication Failed",
						"Could not verify your identity.",
					);
				}
			} catch (error) {
				console.error("Authentication error:", error);

				Alert.alert(
					"Error",
					"An unexpected error occurred while authenticating.",
				);
			} finally {
				setLoading(false);
			}
		};

		authenticateUser();
	}, []);

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: colors.background,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<ActivityIndicator size="small" />
			</View>
		);
	}

	if (!isUnlocked) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: colors.background,
				}}
			/>
		);
	}

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			style={{ backgroundColor: colors.background }}
		>
			<SettingsContainer>
				<SettingsItem title="Test" />
			</SettingsContainer>
		</ScrollView>
	);
}
