import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useAccent } from "../context/accent";

export default function TabLayout() {
	const { accent } = useAccent();

	return (
		<NativeTabs>
			<NativeTabs.Trigger name="index">
				<NativeTabs.Trigger.Icon
					sf={{ default: "house", selected: "house.fill" }}
					selectedColor={accent}
				/>
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="circles">
				<NativeTabs.Trigger.Icon
					sf={{
						default: "circle.circle",
						selected: "circle.circle.fill",
					}}
					selectedColor={accent}
				/>
				<NativeTabs.Trigger.Label>Circles</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="search">
				<NativeTabs.Trigger.Icon
					sf="magnifyingglass"
					selectedColor={accent}
				/>
				<NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
			<NativeTabs.Trigger name="profile">
				<NativeTabs.Trigger.Icon
					sf={{ default: "person", selected: "person.fill" }}
					selectedColor={accent}
				/>
				<NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
