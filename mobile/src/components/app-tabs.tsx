import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import {
  MessageCircle,
  CalendarCheck,
  GraduationCap,
  BookOpen,
  Calendar,
  User,
} from 'lucide-react-native';

import { Colors, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.accent,
        tabBarInactiveTintColor: Colors.light.tabInactive,
        tabBarStyle: {
          backgroundColor: Colors.light.background,
          borderTopColor: Colors.light.separatorOpaque,
          borderTopWidth: 0.33,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: Spacing.two,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.07,
          marginTop: Spacing.half,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => <CalendarCheck size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="homework"
        options={{
          title: 'Homework',
          tabBarIcon: ({ color, size }) => <BookOpen size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Calendar size={24} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={24} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}
