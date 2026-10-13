import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { Clock, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  isActive: boolean;
  onToggle: () => void;
};

const C = {
  primary: '#7C3AED',
  primaryBg: '#F3E8FF',
  success: '#10B981',
  successBg: '#D1FAE5',
  surface: '#ffffff',
  text: '#0F172A',
  textMuted: '#64748B',
};

export default function SyllabusTimelineButton({ isActive, onToggle }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPosition = Math.max(insets.bottom + 16, 24);

  return (
    <View style={[styles.fabContainer, { bottom: bottomPosition }]} pointerEvents="box-none">
      {/* Active Edit Mode Status Pill (floats to the left of the circular FAB) */}
      {isActive && (
        <View style={styles.activeBanner}>
          <View style={styles.pulseDot} />
          <Text style={styles.activeBannerText}>Edit Mode On</Text>
        </View>
      )}

      {/* Circular Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, isActive ? styles.fabActive : styles.fabInactive]}
        activeOpacity={0.82}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={isActive ? 'Finish editing timeline' : 'Open timeline edit mode'}
      >
        {isActive ? (
          <Check size={24} color="#ffffff" strokeWidth={2.8} />
        ) : (
          <Clock size={22} color="#ffffff" strokeWidth={2.4} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 999,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#34D399',
  },
  activeBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  fabInactive: {
    backgroundColor: C.primary,
    ...Platform.select({
      ios: { shadowColor: C.primary },
    }),
  },
  fabActive: {
    backgroundColor: C.success,
    ...Platform.select({
      ios: { shadowColor: C.success },
    }),
  },
});
