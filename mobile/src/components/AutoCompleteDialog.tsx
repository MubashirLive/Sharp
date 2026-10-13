import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { formatDateShort } from './TimelineDatePicker';

const C = {
  primary: '#7C3AED',
  primaryBg: '#F3E8FF',
  surface: '#ffffff',
  text: '#0F172A',
  textMuted: '#64748B',
  success: '#10B981',
  successBg: '#D1FAE5',
  border: '#E2E8F0',
};

type Props = {
  visible: boolean;
  parentType: 'topic' | 'chapter';
  parentName: string;
  childType: string; // "subtopics" or "topics"
  endDate: string; // YYYY-MM-DD — the date that will be assigned
  onConfirm: () => void;
  onCancel: () => void;
};

export default function AutoCompleteDialog({
  visible,
  parentType,
  parentName,
  childType,
  endDate,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.overlay}
        onPress={onCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.dialog}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <View style={styles.iconWrap}>
            <CheckCircle2 size={28} color={C.success} strokeWidth={2.2} />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            All {childType} completed!
          </Text>

          {/* Message */}
          <Text style={styles.message}>
            All {childType} under{' '}
            <Text style={styles.bold}>{parentName}</Text>{' '}
            are now complete. Mark this {parentType} as completed?
          </Text>

          {/* Date info */}
          <View style={styles.dateRow}>
            <AlertCircle size={13} color={C.textMuted} />
            <Text style={styles.dateText}>
              End date will be set to{' '}
              <Text style={styles.dateBold}>{formatDateShort(endDate)}</Text>
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  dialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  bold: {
    fontWeight: '700',
    color: C.text,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
  },
  dateBold: {
    fontWeight: '700',
    color: C.text,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textMuted,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: C.success,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
