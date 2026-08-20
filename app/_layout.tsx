import { Colors } from "@/styles/colors";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { router, Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { supabase } from "./utils/supabase";

export default function RootLayout() {
	const theme = useColorScheme() ?? "light";
	const segments = useSegments();
	const [session, setSession] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profileComplete, setProfileComplete] = useState(false);

	useEffect(() => {
		const getSession = async () => {
			const { data } = await supabase.auth.getSession();

			setSession(data.session);
			setLoading(false);
		};

		getSession();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
		});

		return () => {
			subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (loading) return;

		const checkProfile = async () => {
			if (!session) {
				setProfileComplete(false);

				const inAuthGroup =
					segments[0] === "login" || segments[0] === "signup";

				if (!inAuthGroup) {
					router.replace("/login");
				}

				return;
			}

			const { data: profile } = await supabase
				.from("profiles")
				.select("id")
				.eq("id", session.user.id)
				.maybeSingle();

			const hasProfile = !!profile;
			setProfileComplete(hasProfile);

			const inAuthGroup =
				segments[0] === "login" || segments[0] === "signup";

			const inProfileSetup = segments[0] === "profileSetup";

			if (!hasProfile) {
				if (!inProfileSetup) {
					router.replace("/profileSetup");
				}

				return;
			}

			if (inAuthGroup || inProfileSetup) {
				router.replace("/");
			}
		};

		checkProfile();
	}, [session, loading, segments]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name="emojiReact"
				options={{
					presentation: "formSheet",
					sheetGrabberVisible: true,
					sheetAllowedDetents: [0.15, 1],
					contentStyle: {
						backgroundColor: isLiquidGlassAvailable()
							? "transparent"
							: Colors[theme].background,
					},
				}}
			/>

			{/* <Stack.Screen
        name="emoji-react"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.15, 1],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : Colors[theme].background,
          },
        }}
      /> */}
			<Stack.Screen
				name="editProfile"
				options={{
					presentation: "formSheet",
					sheetGrabberVisible: false,
					gestureEnabled: false,
					sheetAllowedDetents: [0.61],
					contentStyle: {
						backgroundColor: isLiquidGlassAvailable()
							? "transparent"
							: Colors[theme].background,
					},
				}}
			/>
			<Stack.Screen
				name="login"
				options={{
					animation: "slide_from_left",
				}}
			/>
			<Stack.Screen
				name="newPost"
				options={{
					presentation: "formSheet",
					sheetGrabberVisible: true,
					sheetAllowedDetents: [1],
					contentStyle: {
						backgroundColor: isLiquidGlassAvailable()
							? "transparent"
							: Colors[theme].background,
					},
				}}
			/>
			<Stack.Screen
				name="subscriptions"
				options={{
					presentation: "formSheet",
					sheetGrabberVisible: false,
					gestureEnabled: false,
					sheetAllowedDetents: [1],
					contentStyle: {
						backgroundColor: isLiquidGlassAvailable()
							? "transparent"
							: Colors[theme].background,
					},
				}}
			/>
		</Stack>
	);
}
