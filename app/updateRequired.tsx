import { Colors } from "@/styles/colors";
import { Image, StyleSheet, Text, useColorScheme, View } from "react-native";

type UpdateRequiredProps = {
  currentVersion: string;
  requiredVersion: string;
};

export default function UpdateRequiredScreen({
  currentVersion,
  requiredVersion,
}: UpdateRequiredProps) {
  const theme = useColorScheme() ?? "dark";
  const colors = Colors[theme as "light" | "dark"];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.logoContainer, { borderColor: Colors.accent }]}>
          <Image
            source={
              theme === "light"
                ? require("@/assets/images/icon.png")
                : require("@/assets/images/dark-icon.png")
            }
            style={styles.logo}
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Update Circle
        </Text>

        <Text style={[styles.description, { color: colors.secondary }]}>
          A newer version of Circle is required to continue. Update the app to
          get the latest version and continue using Circle.
        </Text>

        <Text style={[styles.version, { color: colors.secondary }]}>
          Version {currentVersion} · Required {requiredVersion}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 12,
  },
  version: {
    fontSize: 13,
    marginTop: 16,
  },
});
