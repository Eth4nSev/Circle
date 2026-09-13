import { useState, type ReactNode } from "react";
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

type Props = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function AnimatedPressable({
  children,
  style,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const [scale] = useState(() => new Animated.Value(1));

  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      tension: 300,
      friction: 12,
    }).start();
  };

  return (
    <Pressable
      {...props}
      style={style}
      onPressIn={(event) => {
        animateScale(0.96);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateScale(1);
        onPressOut?.(event);
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
