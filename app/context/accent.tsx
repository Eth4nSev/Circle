import { Colors } from "@/styles/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

type AccentContextType = {
	accent: string;
	setAccent: (color: string) => void;
	resetAccent: () => void;
};

const AccentContext = createContext<AccentContextType>({
	accent: Colors.accent,
	setAccent: () => {},
	resetAccent: () => {},
});

export function AccentProvider({ children }: { children: React.ReactNode }) {
	const [accent, setAccentState] = useState(Colors.accent);

	useEffect(() => {
		AsyncStorage.getItem("circle-accent").then((savedAccent) => {
			if (savedAccent) {
				setAccentState(savedAccent);
			}
		});
	}, []);

	const setAccent = (color: string) => {
		setAccentState(color);
		AsyncStorage.setItem("circle-accent", color);
	};

	const resetAccent = () => {
		setAccent(Colors.accent);
	};

	return (
		<AccentContext.Provider
			value={{
				accent,
				setAccent,
				resetAccent,
			}}
		>
			{children}
		</AccentContext.Provider>
	);
}

export function useAccent() {
	return useContext(AccentContext);
}
