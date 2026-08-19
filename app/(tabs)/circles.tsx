import PostContainer from "@/components/post";
import { useEffect, useState } from "react";
import {
  ImageBackground,
  RefreshControl,
  ScrollView,
  useColorScheme,
} from "react-native";
import { supabase } from "../utils/supabase";

export default function Index() {
  const theme = useColorScheme() ?? "light";
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getPosts();
  }, []);

  async function getPosts() {
    setRefreshing(true);

    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      setPosts(data ?? []);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ImageBackground
      source={require("@/assets/images/wallpaper.jpg")}
      resizeMode="cover"
      style={{ flex: 1 }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={getPosts} />
        }
      >
        {posts.map((post) => (
          <PostContainer
            key={post.id}
            href={{ uri: post.image }}
            time={post.created_at}
            author={post.author}
            pfp={{ uri: post.pfp }}
            caption={post.caption}
          />
        ))}
      </ScrollView>
    </ImageBackground>
  );
}
