import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TimetableGrid } from '@/components/timetable/TimetableGrid';

export default function TimetableScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9ff' }} edges={['top']}>
      <TimetableGrid />
    </SafeAreaView>
  );
}
