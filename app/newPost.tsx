import { Colors } from "@/styles/colors";
import { Text, useColorScheme, View } from "react-native";

export default function newPost() {
    const theme = useColorScheme() ?? 'light';

    return (
        <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        }}>
            <Text style={{ color: Colors[theme].text, marginTop: 300 }}>New Post</Text>
        </View>
    );
}