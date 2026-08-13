import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<Icon
					sf={{ default: "house", selected: "house.fill" }}
					selectedColor="#17b3da"
				/>
				<Label>Home</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="circles">
				<Icon
					sf={{
						default: "circle.circle",
						selected: "circle.circle.fill",
					}}
					selectedColor="#17b3da"
				/>
				<Label>Circles</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="profile">
				<Icon
					sf={{ default: "person", selected: "person.fill" }}
					selectedColor="#17b3da"
				/>
				<Label>Profile</Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
