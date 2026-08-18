import '../global.css';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="(auth)">
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(teacher)" />
      <Stack.Screen name="(principal)" />
      <Stack.Screen name="chat-detail" />
      <Stack.Screen name="group-chat" />
      <Stack.Screen name="broadcast-channel" />
      <Stack.Screen name="timetable" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="exam" />
      <Stack.Screen name="test" />
      <Stack.Screen name="mark-attendance" />
    </Stack>
  );
}
