import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text as RNText,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MessageCircle,
  CalendarCheck,
  GraduationCap,
  BookOpen,
  Calendar,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Colors, Spacing, TabBarHeight } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Instagram Tab Config ──────────────────────────────────────────────────
const TAB_CONFIG: Record<string, { Icon: LucideIcon; label: string }> = {
  chat:       { Icon: MessageCircle,  label: 'Chat' },
  attendance: { Icon: CalendarCheck,  label: 'Attendance' },
  index:      { Icon: GraduationCap,  label: 'Home' },
  homework:   { Icon: BookOpen,       label: 'Homework' },
  calendar:   { Icon: Calendar,       label: 'Calendar' },
};

// ─── Animated Tab Button ───────────────────────────────────────────────────
function TabButton({
  routeName,
  isFocused,
  onPress,
  isDark,
}: {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  isDark: boolean;
}) {
  const config = TAB_CONFIG[routeName];
  if (!config) return null;

  const { Icon, label } = config;
  const scheme = isDark ? 'dark' : 'light';
  
  // Instagram Style: Active icons are Pure Black (#000000) in light mode, Pure White (#FFFFFF) in dark mode
  const activeColor = Colors[scheme].label;
  const inactiveColor = Colors[scheme].tabInactive;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 250 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 250 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        <Icon
          size={24}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.2 : 1.5}
        />
        <RNText
          style={[
            styles.tabLabel,
            { color: isFocused ? activeColor : inactiveColor },
            isFocused && styles.tabLabelActive,
          ]}
          numberOfLines={1}
        >
          {label}
        </RNText>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Custom Instagram Style Tab Bar ────────────────────────────────────────
export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: any) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const scheme = isDark ? 'dark' : 'light';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Colors[scheme].background,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : Spacing.two,
        },
      ]}
    >
      {/* Top thin separator border line (Instagram style) */}
      <View
        style={[
          styles.topSeparator,
          { backgroundColor: Colors[scheme].separator },
        ]}
      />

      {/* Tab buttons */}
      {state.routes.map((route: any, index: number) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton
            key={route.key}
            routeName={route.name}
            isFocused={isFocused}
            onPress={onPress}
            isDark={isDark}
          />
        );
      })}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    paddingTop: Spacing.oneHalf,
    position: 'relative',
  },

  topSeparator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TabBarHeight,
  },

  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.05,
  },

  tabLabelActive: {
    fontWeight: '700',
  },
});
