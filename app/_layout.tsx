import { Colors } from "@/styles/colors";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack, useSegments } from "expo-router";
import { useState } from "react";
import { useColorScheme } from "react-native";

export default function RootLayout() {
	const theme = useColorScheme() ?? "light";
	const segments = useSegments();
	const [session, setSession] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [profileComplete, setProfileComplete] = useState(false);

	/* useEffect(() => {
		const getSession = async () => {
			const { data } = await supabase.auth.getSession();

			setSession(data.session);

			if (data.session) {
				const { data: profile } = await supabase
					.from("profiles")
					.select("id")
					.eq("id", data.session.user.id)
					.single();

				setProfileComplete(!!profile);
			}

			setLoading(false);
		};

		getSession();

		const { data: listener } = supabase.auth.onAuthStateChange(
			async (_event, session) => {
				setSession(session);

				if (session) {
					const { data: profile } = await supabase
						.from("profiles")
						.select("id")
						.eq("id", session.user.id)
						.single();

					setProfileComplete(!!profile);
				} else {
					setProfileComplete(false);
				}
			},
		);

		return () => {
			listener.subscription.unsubscribe();
		};
	}, []);

	useEffect(() => {
		if (loading) return;

		const inAuthGroup = segments[0] === "login" || segments[0] === "signup";

		//const inProfileSetup = segments[0] === "profileSetup";

		if (!session) {
			if (!inAuthGroup) {
				router.replace("/login");
			}

			return;
		}

		if (!profileComplete) {
			if (!inProfileSetup) {
				router.replace("./profileSetup");
			}

			return;
		}

		if (inAuthGroup  || inProfileSetup ) {
			router.replace("/");
		}
	}, [session, profileComplete, loading, segments]); */

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name="modal"
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

			<Stack.Screen
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
			/>
		</Stack>
	);
}
