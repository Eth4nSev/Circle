import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function Index() {
  const theme = useColorScheme() ?? "light";
  const colors = Colors[theme as "light" | "dark"];
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const clampedScrollY = scrollY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolateLeft: "clamp",
  });

  const translateY = Animated.diffClamp(clampedScrollY, 0, 200);

  async function getPosts(isRefreshing = false) {
    if (isRefreshing) setRefreshing(true);

    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    } else {
      setPosts(data);
    }

    if (isRefreshing) setRefreshing(false);
  }

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <>
      <ScrollView
        style={{
          backgroundColor: Colors[theme as "light" | "dark"].background,
          flex: 1,
        }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => getPosts(true)}
            tintColor={Colors[theme as "light" | "dark"].text}
          />
        }
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <GlassView
            style={{
              width: 100,
              height: 50,
              paddingVertical: 5,
              justifyContent: "center",
              alignItems: "center",
              margin: 10,
              borderRadius: 50,
            }}
            isInteractive
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: "bold",
                fontSize: 20,
              }}
            >
              Home
            </Text>
          </GlassView>
          <Pressable onPress={() => router.push("/newPost")}>
            <GlassView
              style={{
                width: 50,
                height: 50,
                paddingVertical: 5,
                justifyContent: "center",
                alignItems: "center",
                margin: 10,
                borderRadius: 50,
              }}
              isInteractive
            >
              <Ionicons name="add" size={30} color={colors.text} />
            </GlassView>
          </Pressable>
        </View>
        {posts.map((post) => (
          <PostContainer
            key={post.id}
            userId={post.user_id}
            id={post.id}
            time={post.created_at}
            href={post.image}
            caption={post.caption}
          />
        ))}
      </ScrollView>
    </>
  );
}
