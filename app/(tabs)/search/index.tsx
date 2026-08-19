import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function SearchScreen() {
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

            <View style={styles.container}>
                <Text style={styles.text}>Search Page</Text>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#000",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        color: "#fff",
    },
});
