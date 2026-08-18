import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, ShieldCheck, User, GraduationCap, UserCheck, Building2 } from 'lucide-react-native';

import { Text } from '@/components/ui/text';

const PROFILES = [
  {
    id: 'STU-10042',
    name: 'Alex Johnson',
    roleLabel: 'Student (Grade 10-A)',
    route: '/(student)',
    icon: GraduationCap,
    bgColor: '#E3F5FD',
    iconColor: '#1B8CC4',
  },
  {
    id: 'TCH-20015',
    name: 'Mrs. Priya Sharma',
    roleLabel: 'Teacher (Math & Physics • Class Teacher 10-A)',
    route: '/(teacher)',
    icon: UserCheck,
    bgColor: '#F5F3FF',
    iconColor: '#7C3AED',
  },
  {
    id: 'PRN-00001',
    name: 'Dr. Rajeshwar Sharma',
    roleLabel: 'Principal (School Administrator)',
    route: '/(principal)',
    icon: Building2,
    bgColor: '#FFF7ED',
    iconColor: '#EA580C',
  },
];

export default function ProfilesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSelectRole = (route: string) => {
    router.replace(route as any);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* TopAppBar */}
      <View style={styles.headerBar}>
        <ShieldCheck size={28} color="#00355f" />
        <Text style={styles.headerTitle}>Role Selector Gateway</Text>
      </View>

      {/* Main Content */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10 }}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 40) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Select Portal Role</Text>
          <Text style={styles.heroSub}>
            Choose a profile to explore the Student App, Teacher App, or Principal Executive Dashboard.
          </Text>
        </View>

        {/* Role Cards List */}
        <View style={{ gap: 14 }}>
          {PROFILES.map((profile) => {
            const IconComponent = profile.icon;
            return (
              <TouchableOpacity
                key={profile.id}
                activeOpacity={0.7}
                onPress={() => handleSelectRole(profile.route)}
                style={styles.profileCard}
              >
                <View style={[styles.avatarBox, { backgroundColor: profile.bgColor }]}>
                  <IconComponent size={24} color={profile.iconColor} />
                </View>

                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.roleLabel}>{profile.roleLabel}</Text>
                  <Text style={styles.profileId}>ID: {profile.id}</Text>
                </View>

                <View style={styles.chevronBox}>
                  <ChevronRight size={20} color="#000000" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(60,60,67,0.60)',
    textAlign: 'center',
    lineHeight: 20,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B8CC4',
  },
  profileId: {
    fontSize: 11,
    color: 'rgba(60,60,67,0.5)',
  },
  chevronBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
