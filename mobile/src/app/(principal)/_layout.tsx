import { Tabs } from 'expo-router';
import PrincipalTabBar from '@/components/principal-tab-bar';

export default function PrincipalTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PrincipalTabBar {...props} />}
    >
      {/* Order: Chat, Attendance/Reports, Home (center), Announcements, Staff */}
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Reports' }} />
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="announcements" options={{ title: 'Notices' }} />
      <Tabs.Screen name="staff" options={{ title: 'Staff' }} />
    </Tabs>
  );
}
