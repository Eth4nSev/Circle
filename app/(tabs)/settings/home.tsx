import { supabase } from "@/app/utils/supabase";
import SettingsContainer from "@/components/settings/SettingsContainer";
import SettingsItem from "@/components/settings/SettingsItem";
import SettingsLink from "@/components/settings/SettingsLink";
import SignOut from "@/components/settings/SignOut";
import { Colors } from "@/styles/colors";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, useColorScheme } from "react-native";

export default function Index() {
  const theme = useColorScheme() ?? "light";

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
    <>
      <Stack.Screen
        options={{
          headerBackTitle: "",
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: Colors[theme].background }}
      >
        <SettingsContainer>
          <SettingsLink
            href="/editProfile"
            title="Account"
            selectedValue={displayName}
          />
          <SettingsLink href="" title="Privacy & Security" />
        </SettingsContainer>

        <SettingsContainer>
          <SettingsLink href="" title="Appearance" />
          <SettingsLink href="" title="Notifications" />
          <SettingsLink href="" title="Circles" />
        </SettingsContainer>

        <SettingsContainer>
          <SettingsLink
            href="/subscriptions"
            title="Subscriptions"
            selectedValue="Free Plan"
          />
          <SettingsLink href="" title="Support Circle" type="external" />
        </SettingsContainer>

        <SettingsContainer>
          <SettingsItem title="Version" subtitle="0.1.0" />
        </SettingsContainer>

        <SettingsContainer>
          <SignOut title="Sign Out" />
        </SettingsContainer>
      </ScrollView>
    </>
  );
}
