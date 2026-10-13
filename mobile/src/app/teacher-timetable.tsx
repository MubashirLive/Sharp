import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TeacherTimetableGrid } from '@/components/timetable/TeacherTimetableGrid';

export default function TeacherTimetableScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9f9ff' }} edges={['top']}>
      <TeacherTimetableGrid />
    </SafeAreaView>
  );
}
