import { Colors } from "@/styles/colors";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { router, Stack, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import OutageScreen from "./outage";
import { supabase } from "./utils/supabase";

export default function RootLayout() {
  const theme = useColorScheme() ?? "light";
  const segments = useSegments();

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingServer, setCheckingServer] = useState(true);
  const [serverDown, setServerDown] = useState(false);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const { error } = await supabase.from("profiles").select("id").limit(1);

        if (
          error?.message ===
          "Service for this project is restricted due to the following violations: exceed_cached_egress_quota. The project owner must upgrade their plan or remove spend caps to restore service."
        ) {
          setServerDown(true);
        } else {
          setServerDown(false);
        }
      } catch (error: any) {
        if (error?.status === 402) {
          setServerDown(true);
        } else {
          setServerDown(false);
        }
      } finally {
        setCheckingServer(false);
      }
    };

    checkServer();
  }, []);

  useEffect(() => {
    if (checkingServer || serverDown) return;

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
  }, [checkingServer, serverDown]);

  useEffect(() => {
    if (loading || checkingServer || serverDown) return;

    const checkProfile = async () => {
      if (!session) {
        setProfileComplete(false);

        const inAuthGroup = segments[0] === "login" || segments[0] === "signup";

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

      const inAuthGroup = segments[0] === "login" || segments[0] === "signup";

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
  }, [session, loading, checkingServer, serverDown, segments]);

  if (checkingServer) {
    return null;
  }

  if (serverDown) {
    return <OutageScreen />;
  }

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

      <Stack.Screen
        name="editProfile"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: false,
          gestureEnabled: true,
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
          gestureEnabled: true,
          sheetAllowedDetents: [1],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : Colors[theme].background,
          },
        }}
      />

      <Stack.Screen
        name="followers"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          gestureEnabled: true,
          sheetAllowedDetents: [0.5, 1],
          contentStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : Colors[theme].background,
          },
        }}
      />

      <Stack.Screen
        name="following"
        options={{
          presentation: "formSheet",
          sheetGrabberVisible: true,
          gestureEnabled: true,
          sheetAllowedDetents: [0.5, 1],
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
