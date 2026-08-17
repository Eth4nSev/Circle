import { Stack } from "expo-router";

export default function settingsLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Settings',
                    headerTransparent: true,
                    headerBackTitle: '',
                }}
            />
        </Stack>
    )
}