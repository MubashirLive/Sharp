import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/custom-tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      {/* Order: Chat, Attendance, Home (center), Homework, Calendar */}
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="homework" options={{ title: 'Homework' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />

      {/* Profile is hidden from the tab bar — accessed via avatar on Home screen */}
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
