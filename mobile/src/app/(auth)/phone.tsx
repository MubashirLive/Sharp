import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { ArrowLeft, Building2 } from 'lucide-react-native';

import { Text } from '@/components/ui/text';

export default function PhoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useGlobalSearchParams();
  
  const schoolName = params.schoolName as string || 'Institution Name';

  const [phoneNumber, setPhoneNumber] = useState('');

  const isNextEnabled = phoneNumber.length >= 10;

  const handleNext = () => {
    if (isNextEnabled) {
      router.push(`/otp?phoneNumber=${encodeURIComponent(phoneNumber)}`);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View className="flex-1 bg-surface">
      {/* TopAppBar */}
      <View 
        className="flex-row items-center justify-between px-5 bg-surface z-20"
        style={{ paddingTop: insets.top, height: 72 + insets.top }}
      >
        <TouchableOpacity 
          onPress={handleBack}
          activeOpacity={0.7}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-surface-container-high"
        >
          <ArrowLeft size={24} color="#00355f" />
        </TouchableOpacity>
        
        <View className="absolute left-0 right-0 items-center pointer-events-none" style={{ top: insets.top + 24 }}>
          <Text className="text-[20px] leading-[26px] font-semibold text-primary">
            Welcome
          </Text>
        </View>
        
        <View className="w-12" />
      </View>

      {/* Main Content */}
      <ScrollView 
        className="flex-1 px-5 pt-4" 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* School Hero Section */}
        <View className="items-center mt-4 mb-10">
          <View className="w-24 h-24 bg-surface-container-high rounded-full items-center justify-center mb-4 border border-outline-variant shadow-sm">
            {/* Placeholder for School Logo */}
            <Building2 size={40} color="#0058be" />
          </View>
          <Text className="text-[24px] leading-[30px] font-bold text-primary text-center px-4">
            {schoolName}
          </Text>
        </View>

        <Text className="text-[16px] leading-[24px] text-on-surface-variant mb-6 text-center">
          Enter your mobile number to receive a verification code.
        </Text>

        <View className="relative bg-surface-container-lowest border border-outline-variant rounded-lg shadow-sm focus-within:border-secondary">
          <View className="flex-row items-center w-full min-h-[56px] px-4 rounded-lg">
            <View className="flex-col flex-1 py-2">
              <Text className="text-[12px] leading-[16px] font-medium text-outline mb-0.5">
                Mobile Number
              </Text>
              <TextInput
                autoFocus
                keyboardType="phone-pad"
                placeholder="Enter 10-digit number"
                placeholderTextColor="#727780"
                value={phoneNumber}
                onChangeText={(text) => setPhoneNumber(text.replace(/[^0-9]/g, ''))}
                maxLength={10}
                className="w-full text-[16px] leading-[24px] text-on-surface bg-transparent p-0 m-0 border-0 outline-none"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View 
        className="px-5 pt-4 bg-surface border-t border-surface-container-high"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!isNextEnabled}
          activeOpacity={0.8}
          className={`w-full h-[52px] items-center justify-center rounded-full shadow-sm ${
            isNextEnabled ? 'bg-primary' : 'bg-primary opacity-50'
          }`}
        >
          <Text className="text-on-primary text-[14px] leading-[20px] tracking-wide font-semibold">
            Get OTP
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
