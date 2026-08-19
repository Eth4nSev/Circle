import { Colors } from "@/styles/colors";
import { Children, ReactNode } from "react";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import Separator from "../separator";

type SettingsContainerProps = {
  title?: string;
  children?: ReactNode;
};

export default function SettingsContainer({
  title,
  children,
}: SettingsContainerProps) {
  const theme = useColorScheme() ?? "light";
  const items = Children.toArray(children);
  return (
    <View style={{ margin: 16, marginBottom: 0 }}>
      {title && (
        <Text
          style={{
            color: "#888",
            fontSize: 17,
            marginLeft: 16,
            marginBottom: 8,
            fontWeight: "600",
          }}
        >
          {title}
        </Text>
      )}
      <View
        style={[
          styles.settingsContainer,
          { backgroundColor: Colors[theme].card },
        ]}
      >
        {items.map((children, index) => (
          <View key={index}>
            {children}
            {index < items.length - 1 && <Separator />}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  settingsContainer: {
    borderRadius: 20,
  },
});
