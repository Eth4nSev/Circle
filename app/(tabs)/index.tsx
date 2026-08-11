import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Pressable onPress={() => Haptics.selectionAsync()} style={{
        paddingHorizontal: 25,
        paddingVertical: 10,
        backgroundColor: '#17b3da',
        borderRadius: 30,
      }}>
        <Text style={{
          fontSize: 24,
          color: '#fff',
        }}>Haptic Press</Text>
      </Pressable>
    </View>
  );
}
