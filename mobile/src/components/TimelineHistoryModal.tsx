import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Clock, ArrowRight, Calendar } from 'lucide-react-native';
import { TimelineHistoryEntry } from '@/data/curriculumData';
import { formatDateShort } from './TimelineDatePicker';

const C = {
  primary: '#7C3AED',
  primaryBg: '#F3E8FF',
  surface: '#ffffff',
  bg: '#F8FAFC',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
};

type Props = {
  visible: boolean;
  nodeName: string;
  nodeType: 'Chapter' | 'Topic' | 'Subtopic';
  entries: TimelineHistoryEntry[];
  onClose: () => void;
};

function formatTimestamp(isoStr: string): string {
  const d = new Date(isoStr);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = d.getHours();
  const mins = `${d.getMinutes()}`.padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${day} ${month} ${year}, ${h}:${mins} ${ampm}`;
}

export default function TimelineHistoryModal({
  visible,
  nodeName,
  nodeType,
  entries,
  onClose,
}: Props) {
  // Sort entries in reverse chronological order
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.overlay}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.sheet}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Clock size={20} color={C.primary} strokeWidth={2.2} />
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Timeline History
                </Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  {nodeType}: {nodeName}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* History List */}
          <ScrollView
            style={styles.listWrap}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {sortedEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={32} color={C.textMuted} />
                <Text style={styles.emptyTitle}>No History Yet</Text>
                <Text style={styles.emptySub}>
                  Timeline events will appear here once dates are set.
                </Text>
              </View>
            ) : (
              sortedEntries.map((entry, idx) => {
                const isStart = entry.field === 'start_date';
                const isLast = idx === sortedEntries.length - 1;

                return (
                  <View key={entry.id} style={styles.entryRow}>
                    {/* Timeline connector */}
                    <View style={styles.connectorColumn}>
                      <View
                        style={[
                          styles.dot,
                          isStart ? styles.dotStart : styles.dotEnd,
                        ]}
                      />
                      {!isLast && <View style={styles.connectorLine} />}
                    </View>

                    {/* Entry content */}
                    <View style={[styles.entryCard, !isLast && styles.entryCardSpaced]}>
                      <View style={styles.entryHeader}>
                        <View
                          style={[
                            styles.actionBadge,
                            isStart ? styles.actionBadgeStart : styles.actionBadgeEnd,
                          ]}
                        >
                          <Text
                            style={[
                              styles.actionBadgeText,
                              isStart ? styles.actionBadgeStartText : styles.actionBadgeEndText,
                            ]}
                          >
                            {isStart ? 'Started' : 'Completed'}
                          </Text>
                        </View>
                        <Text style={styles.dateValue}>
                          {formatDateShort(entry.newValue)}
                        </Text>
                      </View>

                      <Text style={styles.entryMeta}>
                        by {entry.changedBy}
                      </Text>
                      <Text style={styles.entryTimestamp}>
                        {formatTimestamp(entry.changedAt)}
                      </Text>

                      {entry.note && (
                        <View style={styles.noteWrap}>
                          <ArrowRight size={10} color={C.textMuted} />
                          <Text style={styles.noteText}>{entry.note}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listWrap: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Timeline entries
  entryRow: {
    flexDirection: 'row',
  },
  connectorColumn: {
    width: 20,
    alignItems: 'center',
    paddingTop: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotStart: {
    backgroundColor: C.warning,
  },
  dotEnd: {
    backgroundColor: C.success,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: C.border,
    marginTop: 2,
  },
  entryCard: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  entryCardSpaced: {
    marginBottom: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionBadgeStart: {
    backgroundColor: C.warningBg,
  },
  actionBadgeEnd: {
    backgroundColor: C.successBg,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBadgeStartText: {
    color: C.warning,
  },
  actionBadgeEndText: {
    color: C.success,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  entryMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
  },
  entryTimestamp: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },
  noteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  noteText: {
    fontSize: 10,
    fontWeight: '500',
    color: C.textMuted,
    flex: 1,
  },
});
