import { supabase } from "@/app/utils/supabase";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";

type Circle = {
  id: string;
  name: string;
  color: string;
  icon_type: "photo" | "emoji" | "monogram";
  icon_value: string | null;
  created_by: string;
};

export default function Index() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];

  const [circles, setCircles] = useState<Circle[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function getCircles(isRefreshing = false) {
    if (isRefreshing) {
      setRefreshing(true);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCircles([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const { data, error } = await supabase
      .from("circle_members")
      .select(
        `
          circle_id,
          circles (
            id,
            name,
            color,
            icon_type,
            icon_value,
            created_by
          )
        `,
      )
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching Circles:", error);
      setCircles([]);
    } else {
      const loadedCircles = (data ?? [])
        .map((item: any) => item.circles)
        .filter(Boolean);

      setCircles(loadedCircles);
    }

    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    getCircles();
  }, []);

  const sortedCircles = useMemo(
    () => [...circles].sort((a, b) => a.name.localeCompare(b.name)),
    [circles],
  );

  function openCircle(circle: Circle) {
    router.push({
      pathname: "/circle",
      params: {
        id: circle.id,
      },
    });
  }

  function getCircleIcon(circle: Circle) {
    if (circle.icon_type === "emoji" && circle.icon_value) {
      return <Text style={styles.circleIconText}>{circle.icon_value}</Text>;
    }

    if (circle.icon_type === "monogram" && circle.icon_value) {
      return <Text style={styles.circleIconText}>{circle.icon_value}</Text>;
    }

    return (
      <Text style={styles.circleIconText}>
        {circle.name.charAt(0).toUpperCase()}
      </Text>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => getCircles(true)}
            tintColor={colors.text}
          />
        }
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
              },
            ]}
          >
            Circles
          </Text>

          <View style={styles.headerActions}>
            <Pressable
              onPress={() =>
                setView((current) => (current === "grid" ? "list" : "grid"))
              }
            >
              <GlassView style={styles.headerButton} isInteractive>
                <Ionicons
                  name={view === "grid" ? "list-outline" : "grid-outline"}
                  size={25}
                  color={colors.text}
                />
              </GlassView>
            </Pressable>

            <Pressable onPress={() => router.push("/create")}>
              <GlassView style={styles.headerButton} isInteractive>
                <Ionicons name="add" size={30} color={colors.text} />
              </GlassView>
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : view === "grid" ? (
          sortedCircles.length === 0 ? (
            <View style={styles.empty}>
              <View
                style={[
                  styles.emptyIcon,
                  {
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <Ionicons
                  name="people-outline"
                  size={30}
                  color={colors.secondary}
                />
              </View>

              <Text
                style={[
                  styles.emptyTitle,
                  {
                    color: colors.text,
                  },
                ]}
              >
                No Circles yet
              </Text>

              <Text
                style={[
                  styles.emptyText,
                  {
                    color: colors.secondary,
                  },
                ]}
              >
                Create a Circle to start sharing with your people.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {sortedCircles.map((circle) => (
                <Pressable
                  key={circle.id}
                  onPress={() => openCircle(circle)}
                  style={({ pressed }) => [
                    styles.gridItem,
                    {
                      opacity: pressed ? 0.65 : 1,
                    },
                  ]}
                >
                  <GlassView style={{ borderRadius: 75 }} isInteractive>
                    <View
                      style={[
                        styles.circleIcon,
                        {
                          backgroundColor: circle.color,
                        },
                      ]}
                    >
                      {getCircleIcon(circle)}
                    </View>
                  </GlassView>

                  <Text
                    numberOfLines={1}
                    style={[
                      styles.circleName,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {circle.name}
                  </Text>
                </Pressable>
              ))}

              <Pressable
                onPress={() => router.push("/create")}
                style={({ pressed }) => [
                  styles.gridItem,
                  {
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.circleIcon,
                    styles.newCircleIcon,
                    {
                      borderColor: colors.separator,
                    },
                  ]}
                >
                  <Ionicons name="add" size={30} color={colors.secondary} />
                </View>

                <Text
                  style={[
                    styles.circleName,
                    {
                      color: colors.secondary,
                    },
                  ]}
                >
                  New Circle
                </Text>
              </Pressable>
            </View>
          )
        ) : (
          <View
            style={[
              styles.list,
              {
                backgroundColor: colors.card,
              },
            ]}
          >
            {sortedCircles.map((circle, index) => (
              <Pressable
                key={circle.id}
                onPress={() => openCircle(circle)}
                style={({ pressed }) => [
                  styles.listItem,
                  {
                    opacity: pressed ? 0.65 : 1,
                    borderBottomColor:
                      index === sortedCircles.length - 1
                        ? "transparent"
                        : colors.separator,
                  },
                ]}
              >
                <View
                  style={[
                    styles.listIcon,
                    {
                      backgroundColor: circle.color,
                    },
                  ]}
                >
                  {getCircleIcon(circle)}
                </View>

                <View style={styles.listText}>
                  <Text
                    style={[
                      styles.listName,
                      {
                        color: colors.text,
                      },
                    ]}
                  >
                    {circle.name}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={colors.secondary}
                />
              </Pressable>
            ))}

            <Pressable
              onPress={() => router.push("/create")}
              style={({ pressed }) => [
                styles.listItem,
                {
                  opacity: pressed ? 0.65 : 1,
                  borderBottomWidth: 0,
                },
              ]}
            >
              <View
                style={[
                  styles.listIcon,
                  styles.newListIcon,
                  {
                    borderColor: colors.separator,
                  },
                ]}
              >
                <Ionicons name="add" size={25} color={colors.secondary} />
              </View>

              <View style={styles.listText}>
                <Text
                  style={[
                    styles.listName,
                    {
                      color: colors.secondary,
                    },
                  ]}
                >
                  New Circle
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },

  titleGlass: {
    width: 110,
    height: 50,
    paddingVertical: 5,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    borderRadius: 50,
  },

  title: {
    fontWeight: "bold",
    fontSize: 25,
    left: 16,
  },

  headerActions: {
    flexDirection: "row",
    gap: 8,
    marginRight: 10,
  },

  headerButton: {
    width: 50,
    height: 50,
    paddingVertical: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50,
  },

  loading: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    columnGap: 40,
    rowGap: 28,
    paddingHorizontal: 20,
  },
  gridItem: {
    width: 72,
    alignItems: "center",
  },

  circleIcon: {
    width: 75,
    height: 75,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
  },

  circleIconText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "700",
  },

  circleName: {
    fontSize: 13,
    fontWeight: "500",
    marginTop: 8,
    textAlign: "center",
    maxWidth: 80,
  },

  newCircleIcon: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },

  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 70,
  },

  emptyIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
  },

  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    maxWidth: 280,
  },

  list: {
    marginHorizontal: 10,
    borderRadius: 18,
    overflow: "hidden",
  },

  listItem: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  listText: {
    flex: 1,
    marginLeft: 14,
  },

  listName: {
    fontSize: 16,
    fontWeight: "600",
  },

  newListIcon: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
});
