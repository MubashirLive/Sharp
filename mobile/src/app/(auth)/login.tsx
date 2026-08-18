import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';

// Mock Data
const STATES = [
  { label: 'California', value: 'CA' },
  { label: 'New York', value: 'NY' },
  { label: 'Texas', value: 'TX' },
  { label: 'Florida', value: 'FL' },
];

const CITIES: Record<string, { label: string; value: string }[]> = {
  CA: [
    { label: 'Los Angeles', value: 'LA' },
    { label: 'San Francisco', value: 'SF' },
    { label: 'San Diego', value: 'SD' },
  ],
  NY: [
    { label: 'New York City', value: 'NYC' },
    { label: 'Buffalo', value: 'BUF' },
  ],
  TX: [
    { label: 'Austin', value: 'AUS' },
    { label: 'Houston', value: 'HOU' },
  ],
  FL: [
    { label: 'Miami', value: 'MIA' },
    { label: 'Orlando', value: 'ORL' },
  ]
};

const SCHOOLS: Record<string, { label: string; value: string }[]> = {
  LA: [
    { label: 'Lincoln High School', value: 'lincoln_high' },
  ],
  SF: [
    { label: 'Golden Gate Academy', value: 'golden_gate' },
  ],
  SD: [
    { label: 'Pacific Beach High', value: 'pacific_high' },
  ],
  NYC: [
    { label: 'Brooklyn Tech', value: 'brooklyn_tech' },
  ],
  BUF: [
    { label: 'Buffalo Academy', value: 'buffalo_acad' },
  ],
  AUS: [
    { label: 'Austin High', value: 'austin_high' },
  ],
  HOU: [
    { label: 'Houston Science Academy', value: 'houston_sci' },
  ],
  MIA: [
    { label: 'Miami Arts Charter', value: 'miami_arts' },
  ],
  ORL: [
    { label: 'Orlando Science', value: 'orl_sci' },
  ]
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<string>('');

  const handleStateChange = (val: string) => {
    setSelectedState(val);
    setSelectedCity('');
    setSelectedSchool('');
  };

  const handleCityChange = (val: string) => {
    setSelectedCity(val);
    setSelectedSchool('');
  };

  const isNextEnabled = selectedState && selectedCity && selectedSchool;

  const handleNext = () => {
    if (isNextEnabled) {
      const schoolObj = SCHOOLS[selectedCity]?.find(s => s.value === selectedSchool);
      router.push({
        pathname: '/(auth)/phone',
        params: { schoolName: schoolObj?.label || 'Selected School' }
      });
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
            Select Institution
          </Text>
        </View>
        
        <View className="w-12" />
      </View>

      {/* Main Content */}
      <ScrollView 
        className="flex-1 px-5 pt-6" 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[16px] leading-[24px] text-on-surface-variant mb-2">
          Please select your state, city, and institution to continue.
        </Text>

        <View className="flex flex-col space-y-6 mt-4">
          <SearchableDropdown
            label="State"
            data={STATES}
            value={selectedState}
            onSelect={handleStateChange}
            placeholder="Select State"
          />

          <SearchableDropdown
            label="City"
            data={selectedState ? CITIES[selectedState] || [] : []}
            value={selectedCity}
            onSelect={handleCityChange}
            placeholder="Select City"
            disabled={!selectedState}
          />

          <SearchableDropdown
            label="School"
            data={selectedCity ? SCHOOLS[selectedCity] || [] : []}
            value={selectedSchool}
            onSelect={setSelectedSchool}
            placeholder="Select School"
            disabled={!selectedCity}
          />
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
          className={`w-full h-[52px] items-center justify-center rounded-full shadow-sm transition-colors ${
            isNextEnabled ? 'bg-primary' : 'bg-primary opacity-50'
          }`}
        >
          <Text className="text-on-primary text-[14px] leading-[20px] tracking-wide font-semibold">
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
