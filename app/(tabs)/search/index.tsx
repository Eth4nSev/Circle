import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { GlassView } from "expo-glass-effect";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export default function SearchScreen() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme];

  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchProfiles = async (searchQuery = query) => {
    const search = searchQuery.trim();

    if (!search) {
      setProfiles([]);
      setSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    const { data, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
      .order("username", { ascending: true })
      .limit(30);

    if (profilesError) {
      setError(profilesError.message);
      setProfiles([]);
    } else {
      setProfiles((data ?? []) as Profile[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      searchProfiles();
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  const onRefresh = async () => {
    setRefreshing(true);
    await searchProfiles();
    setRefreshing(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Search",
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GlassView style={styles.searchBar} isInteractive>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search people"
            placeholderTextColor={colors.secondary}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, { color: colors.text }]}
          />
        </GlassView>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
            />
          }
        >
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={[styles.message, { color: colors.text }]}>
                Something went wrong.
              </Text>

              <Text
                style={[styles.secondaryMessage, { color: colors.secondary }]}
              >
                {error}
              </Text>
            </View>
          ) : !searched ? (
            <View style={styles.center}>
              <Text style={[styles.message, { color: colors.text }]}>
                Search for people on Circle
              </Text>
            </View>
          ) : profiles.length === 0 ? (
            <View style={styles.center}>
              <Text style={[styles.message, { color: colors.text }]}>
                No accounts found
              </Text>

              <Text
                style={[styles.secondaryMessage, { color: colors.secondary }]}
              >
                Try searching for another name or username.
              </Text>
            </View>
          ) : (
            <View style={styles.results}>
              {profiles.map((profile) => (
                <Pressable
                  key={profile.id}
                  style={({ pressed }) => [
                    styles.profile,
                    pressed && styles.profilePressed,
                  ]}
                  onPress={() => router.push("/(tabs)/search/profile")}
                >
                  <View style={styles.avatarContainer}>
                    {profile.avatar_url ? (
                      <Image
                        source={{ uri: profile.avatar_url }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatar,
                          styles.avatarPlaceholder,
                          {
                            backgroundColor: colors.secondary,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            { color: colors.background },
                          ]}
                        >
                          {(profile.display_name || profile.username || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.profileInfo}>
                    <Text
                      style={[styles.name, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {profile.display_name ||
                        profile.username ||
                        "Unnamed account"}
                    </Text>

                    {profile.username && (
                      <Text
                        style={[styles.username, { color: colors.secondary }]}
                        numberOfLines={1}
                      >
                        @{profile.username}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  searchBar: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
  },

  input: {
    flex: 1,
    paddingHorizontal: 18,
    fontSize: 16,
  },

  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  results: {
    gap: 8,
  },

  profile: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 16,
  },

  profilePressed: {
    opacity: 0.6,
  },

  avatarContainer: {
    width: 52,
    height: 52,
    marginRight: 12,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 20,
    fontWeight: "700",
  },

  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  username: {
    fontSize: 14,
    marginTop: 2,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  message: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  secondaryMessage: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
  },
});
