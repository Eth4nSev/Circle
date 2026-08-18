import { Colors } from "@/styles/colors";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<Icon
					sf={{ default: "house", selected: "house.fill" }}
					selectedColor={Colors.accent}
				/>
				<Label>Home</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="circles">
				<Icon
					sf={{
						default: "circle.circle",
						selected: "circle.circle.fill",
					}}
					selectedColor={Colors.accent}
				/>
				<Label>Circles</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="profile">
				<Icon
					sf={{ default: "person", selected: "person.fill" }}
					selectedColor={Colors.accent}
				/>
				<Label>Profile</Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="search" role="search">
				<Icon
					sf="magnifyingglass"
					selectedColor={Colors.accent}
				/>
				<Label>Search</Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
