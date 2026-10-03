import { supabase } from "@/app/utils/supabase";
import SettingsContainer from "@/components/settings/SettingsContainer";
import SettingsItem from "@/components/settings/SettingsItem";
import SettingsLink from "@/components/settings/SettingsLink";
import SignOut from "@/components/settings/SignOut";
import { AppData } from "@/data/version";
import { Colors } from "@/styles/colors";
import { useEffect, useState } from "react";
import { ScrollView, useColorScheme } from "react-native";

export default function Index() {
	const theme = useColorScheme() ?? "light";
	const colors = Colors[theme as "light" | "dark"];

	const [displayName, setDisplayName] = useState("Display Name");
	const [username, setUsername] = useState("username");

	useEffect(() => {
		async function getProfile() {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				console.error("Error fetching auth user:", userError);
				return;
			}

			const { data, error } = await supabase
				.from("profiles")
				.select("display_name, username")
				.eq("id", user.id)
				.single();

			if (error) {
				console.error("Error fetching profile:", error);
				return;
			}

			if (data) {
				setDisplayName(data.display_name);
				setUsername(data.username);
			}
		}

		getProfile();
	});

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			style={{
				backgroundColor: colors.background,
			}}
		>
			<SettingsContainer>
				<SettingsLink
					href="/settings/accountSettings"
					title="Account"
					selectedValue={displayName}
				/>
				<SettingsLink
					href="/settings/privacy-security"
					title="Privacy & Security"
				/>
				<SettingsLink href="/settings/appearance" title="Appearance" />
			</SettingsContainer>

			<SettingsContainer>
				<SettingsLink
					href="/settings/notifications"
					title="Notifications"
				/>
				{/* <SettingsLink href="/settings/circlesSettings" title="Circles" /> */}
			</SettingsContainer>

			{/* <SettingsContainer>
        <SettingsLink
          href="/subscriptions"
          title="Subscriptions"
          selectedValue="Free Plan"
        />
        <SettingsLink href="" title="Support Circle" type="external" />
      </SettingsContainer> */}

			<SettingsContainer>
				<SettingsItem title="Version" subtitle={AppData.version} />
			</SettingsContainer>

			<SettingsContainer>
				<SignOut title="Sign Out" />
			</SettingsContainer>
		</ScrollView>
	);
}
