import { MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { Image, StyleSheet, View } from "react-native";

const iconSize: number = 24;

export default function PostContainer({ iconSize }: { iconSize: number }) {
  return (
    <GlassView style={styles.postContainer}>
      <Image
        source={require("@/assets/images/circle.png")}
        style={styles.postImage}
      />
      <View style={styles.postOptions}>
        <MaterialIcons name="thumb-up-off-alt" size={iconSize} color={"#000"} />
        <MaterialIcons
          name="chat-bubble-outline"
          size={iconSize}
          color={"#000"}
        />
        <MaterialIcons name="face" size={iconSize} color={"#000"} />
        <View style={styles.morePostOptions}>
          <MaterialIcons name="more-horiz" size={iconSize} color={"#000"} />
        </View>
      </View>
    </GlassView>
  );
}

const styles = StyleSheet.create({
  postContainer: {
    padding: 25,
    borderRadius: 10,
  },
  postImage: {
    width: 300,
    height: 169,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#000",
    borderRadius: 5,
  },
  postOptions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  morePostOptions: {
    position: "absolute",
    right: 0,
  },
});
