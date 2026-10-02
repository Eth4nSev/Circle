import { Colors } from "@/styles/colors";
import Constants from "expo-constants";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { useColorScheme } from "react-native";
import { AccentProvider } from "./context/accent";
import OutageScreen from "./outage";
import UpdateRequiredScreen from "./updateRequired";
import { supabase } from "./utils/supabase";

SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});

const compareVersions = (a: string, b: string) => {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i++) {
    const aPart = aParts[i] ?? 0;
    const bPart = bParts[i] ?? 0;

    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  return 0;
};

export default function RootLayout() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const segments = useSegments();
  const currentVersion = Constants.expoConfig?.version ?? "0.0.0";

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingServer, setCheckingServer] = useState(true);
  const [serverDown, setServerDown] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [requiredVersion, setRequiredVersion] = useState("0.0.0");

  const betaOpened = useRef(false);

  useEffect(() => {
    const checkAppConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("app_config")
          .select("minimum_version")
          .eq("id", 1)
          .maybeSingle();

        if (
          error?.message ===
          "Service for this project is restricted due to the following violations: exceed_cached_egress_quota. The project owner must upgrade their plan or remove spend caps to restore service."
        ) {
          setServerDown(true);
          return;
        }

        const errorStatus = (error as any)?.status;

        if (errorStatus === 402 || errorStatus === 540) {
          setServerDown(true);
          return;
        }

        if (error) {
          console.error("Failed to load app config:", error);
          return;
        }

        if (
          data?.minimum_version &&
          compareVersions(currentVersion, data.minimum_version) < 0
        ) {
          setRequiredVersion(data.minimum_version);
          setUpdateRequired(true);
        }
      } catch (error: any) {
        if (error?.status === 402 || error?.status === 540) {
          setServerDown(true);
        } else {
          console.error("Failed to check app version:", error);
        }
      } finally {
        setCheckingServer(false);
      }
    };

    checkAppConfig();
  }, [currentVersion]);

  useEffect(() => {
    if (checkingServer || serverDown || updateRequired) return;

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
  }, [checkingServer, serverDown, updateRequired]);

  useEffect(() => {
    if (loading || checkingServer || serverDown || updateRequired) return;

    const checkProfile = async () => {
      setCheckingProfile(true);

      if (!session) {
        setProfileComplete(false);
        betaOpened.current = false;
        setCheckingProfile(false);

        const inAuthGroup = segments[0] === "login" || segments[0] === "signup";

        if (!inAuthGroup) {
          router.replace("/login");
        }

        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, updated")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load profile:", error);
        setCheckingProfile(false);
        return;
      }

      const hasProfile = !!profile;

      setProfileComplete(hasProfile);

      const inAuthGroup = segments[0] === "login" || segments[0] === "signup";

      const inProfileSetup = segments[0] === "profileSetup";
      const inBetaWelcome = String(segments[0]) === "betaWelcome";

      if (!hasProfile) {
        betaOpened.current = false;

        if (!inProfileSetup) {
          router.replace("/profileSetup");
        }

        setCheckingProfile(false);
        return;
      }

      if (inAuthGroup || inProfileSetup) {
        router.replace("/");
        setCheckingProfile(false);
        return;
      }

      if (profile.updated === true && !betaOpened.current && !inBetaWelcome) {
        betaOpened.current = true;
        setCheckingProfile(false);

        router.push("/betaWelcome");

        return;
      }

      setCheckingProfile(false);
    };

    checkProfile();
  }, [session, loading, checkingServer, serverDown, updateRequired]);

  if (checkingServer) {
    return null;
  }

  if (serverDown) {
    return <OutageScreen />;
  }

  if (updateRequired) {
    return (
      <UpdateRequiredScreen
        currentVersion={currentVersion}
        requiredVersion={requiredVersion}
      />
    );
  }

  return (
    <AccentProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerTransparent: true,
        }}
      >
        <Stack.Screen
          name="emojiReact"
          options={{
            presentation: "formSheet",
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.15, 1],
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.background,
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
                : colors.background,
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
            sheetGrabberVisible: false,
            sheetAllowedDetents: [1],
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.background,
            },
          }}
        />

        <Stack.Screen
          name="create"
          options={{
            presentation: "formSheet",
            sheetGrabberVisible: false,
            sheetAllowedDetents: [1],
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.background,
            },
          }}
        />

        <Stack.Screen
          name="editPost"
          options={{
            presentation: "formSheet",
            sheetGrabberVisible: false,
            sheetAllowedDetents: [1],
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.background,
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
                : colors.background,
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
                : colors.background,
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
                : colors.background,
            },
          }}
        />

        <Stack.Screen
          name="invites"
          options={{
            presentation: "card",
            gestureEnabled: true,
          }}
        />

        <Stack.Screen
          name="circleChat"
          options={{
            headerShown: false,
            presentation: "card",
            gestureEnabled: true,
          }}
        />

        <Stack.Screen
          name="circleInvites"
          options={{
            headerShown: false,
            presentation: "card",
            gestureEnabled: true,
          }}
        />

        <Stack.Screen
          name="circleMembers"
          options={{
            headerShown: false,
            presentation: "card",
            gestureEnabled: true,
          }}
        />

        <Stack.Screen
          name="circleSettings"
          options={{
            headerShown: false,
            presentation: "card",
            gestureEnabled: true,
          }}
        />

        <Stack.Screen
          name="comments"
          options={{
            presentation: "formSheet",
            sheetGrabberVisible: true,
            gestureEnabled: true,
            sheetAllowedDetents: [1],
            contentStyle: {
              backgroundColor: isLiquidGlassAvailable()
                ? "transparent"
                : colors.background,
            },
          }}
        />
      </Stack>
    </AccentProvider>
  );
}
