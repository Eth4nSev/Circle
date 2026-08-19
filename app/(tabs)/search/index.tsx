import { Colors } from "@/styles/colors";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
} from "react-native";

export default function SearchScreen() {
  const theme = useColorScheme() ?? "light";
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions: {
            placeholder: "Search here...",
            onChangeText: (event) => console.log(event.nativeEvent.text),
          },
          headerTransparent: true,
          headerShadowVisible: false,
          headerTitle: "",
        }}
      />

      <ScrollView
        style={[
          styles.container,
          { backgroundColor: Colors[theme].background },
        ]}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={{ color: Colors[theme].text }}>Search Page</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
