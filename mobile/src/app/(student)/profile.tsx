import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Settings, Bell, FileText, HelpCircle, LogOut, MoreVertical, Edit2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { Text } from '@/components/ui/text';

const MENU_ITEMS = [
  { id: '1', title: 'Notifications', icon: Bell, badge: '3' },
  { id: '2', title: 'Report Cards', icon: FileText },
  { id: '3', title: 'Settings', icon: Settings },
  { id: '4', title: 'Help & Support', icon: HelpCircle },
];

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between bg-surface">
        <Text className="text-2xl font-normal tracking-tight text-on-surface">Profile</Text>
        <TouchableOpacity className="w-10 h-10 rounded-full flex items-center justify-center bg-surface active:bg-surface-variant">
          <MoreVertical size={24} color="rgba(60,60,67,0.60)" strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Profile Info */}
        <View className="flex-col items-center py-6 px-4">
          <View className="relative mb-4">
            <View className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center shadow-sm border border-outline-variant/30">
              <Text className="text-on-primary-container text-3xl font-medium">AS</Text>
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md active:opacity-90">
              <Edit2 size={16} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          
          <Text className="text-2xl font-medium text-on-surface mb-1">Alex Smith</Text>
          <Text className="text-sm text-on-surface-variant mb-2">Class 10 - Section A</Text>
          <View className="px-3 py-1 bg-surface-container-high rounded-full border border-outline-variant/30">
            <Text className="text-xs font-medium text-on-surface-variant">Roll No: 14</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-4 mb-6">
          <View className="flex-row bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-sm">
            <View className="flex-1 py-4 items-center border-r border-outline-variant/30">
              <Text className="text-xl font-medium text-primary mb-1">92%</Text>
              <Text className="text-xs font-medium tracking-wider text-on-surface-variant uppercase">Attendance</Text>
            </View>
            <View className="flex-1 py-4 items-center border-r border-outline-variant/30">
              <Text className="text-xl font-medium text-tertiary mb-1">45</Text>
              <Text className="text-xs font-medium tracking-wider text-on-surface-variant uppercase">Tasks Done</Text>
            </View>
            <View className="flex-1 py-4 items-center">
              <Text className="text-xl font-medium text-on-surface mb-1">5th</Text>
              <Text className="text-xs font-medium tracking-wider text-on-surface-variant uppercase">Rank</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View className="px-4 space-y-3 mb-6">
          {MENU_ITEMS.map((item) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                className="flex-row items-center p-4 bg-surface-container-lowest rounded-3xl border border-outline-variant/30 shadow-sm active:bg-surface-container-high"
              >
                <View className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center mr-4">
                  <IconComponent size={20} color="rgba(60,60,67,0.60)" strokeWidth={1.5} />
                </View>
                <Text className="flex-1 text-base font-medium text-on-surface">{item.title}</Text>
                {item.badge && (
                  <View className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mr-3">
                    <Text className="text-on-primary text-[10px] font-bold">{item.badge}</Text>
                  </View>
                )}
                <ChevronRight size={20} color="rgba(60,60,67,0.30)" strokeWidth={1.5} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout */}
        <View className="px-4 mb-8">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center p-4 bg-error-container rounded-3xl shadow-sm active:bg-error-container/80"
          >
            <LogOut size={20} color="#FF3B30" style={{ marginRight: 8 }} strokeWidth={1.5} />
            <Text className="text-base font-medium text-error">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
