import AddPost from "@/components/addPost";
import PostContainer from "@/components/post";
import { Colors } from "@/styles/colors";
import { GlassView } from "expo-glass-effect";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  RefreshControl,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function Index() {
  const theme = useColorScheme() ?? "light";
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
      <Animated.ScrollView
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <GlassView
            style={{
              width: 100,
              height: 40,
              paddingVertical: 5,
              justifyContent: "center",
              alignItems: "center",
              margin: 10,
              borderRadius: 20,
            }}
            isInteractive
          >
            <Text
              style={{
                color: Colors[theme as "light" | "dark"].text,
                fontWeight: "bold",
                fontSize: 20,
              }}
            >
              Home
            </Text>
          </GlassView>
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
      </Animated.ScrollView>

      <Animated.View
        style={{
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          position: "absolute",
          bottom: 100,
          transform: [{ translateY: translateY }],
        }}
      >
        <AddPost href="../newPost" />
      </Animated.View>
    </>
  );
}
