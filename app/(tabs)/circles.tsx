import PostContainer from "@/components/post";
import { StyleSheet, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <PostContainer />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});
