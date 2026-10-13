import { Tabs } from 'expo-router';
import TeacherTabBar from '@/components/teacher-tab-bar';

export default function TeacherTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TeacherTabBar {...props} />}
    >
      {/* Order: Chat, Attendance, Home (center), Homework, Calendar */}
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Attendance' }} />
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="homework" options={{ title: 'Homework' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />

      {/* My Classes is accessible via route without showing in tab bar */}
      <Tabs.Screen
        name="my-classes"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
