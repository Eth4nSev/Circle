import { MaterialIcons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { Image, StyleSheet, View } from "react-native";

export default function PostContainer() {
  return (
    <GlassView style={styles.postContainer}>
      <Image
        source={require("@/assets/images/circle.png")}
        style={styles.postImage}
      />
      <View style={styles.postOptions}>
        <MaterialIcons name="thumb-up-off-alt" size={20} color={"#000"} />
        <MaterialIcons name="chat-bubble-outline" size={20} color={"#000"} />
        <MaterialIcons name="" size={20} color={"#000"} />
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
  postOptions: {},
});
