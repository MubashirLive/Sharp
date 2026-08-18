import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  X,
  FileText,
  Award,
  UserCheck,
  Filter,
  Bell,
  Archive,
} from 'lucide-react-native';
import {
  INITIAL_ANNOUNCEMENTS,
  AnnouncementItem,
  AnnouncementCategory,
} from '@/components/announcement/AnnouncementCarousel';

type TabMode = 'active' | 'archive';

const CATEGORY_FILTERS: { id: string; label: string; cat?: AnnouncementCategory }[] = [
  { id: 'all', label: 'All Notices' },
  { id: 'ptm', label: '📢 PTM', cat: 'PTM' },
  { id: 'sports', label: '🏆 Sports', cat: 'SPORTS' },
  { id: 'results', label: '📊 Results', cat: 'RESULTS' },
  { id: 'tours', label: '🚌 Tours', cat: 'TOUR' },
  { id: 'notices', label: '📋 General', cat: 'NOTICE' },
];

export default function AnnouncementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabMode>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [readState, setReadState] = useState<Record<string, boolean>>({});
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // Today date YYYY-MM-DD
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Separate active and past announcements
  const { activeItems, pastItems } = useMemo(() => {
    const active: AnnouncementItem[] = [];
    const past: AnnouncementItem[] = [];

    INITIAL_ANNOUNCEMENTS.forEach((item) => {
      if (item.expiryDate >= todayStr) {
        active.push(item);
      } else {
        past.push(item);
      }
    });

    return { activeItems: active, pastItems: past };
  }, [todayStr]);

  // Current list based on active tab
  const currentTabItems = activeTab === 'active' ? activeItems : pastItems;

  // Filter items by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return currentTabItems;
    const matchedFilter = CATEGORY_FILTERS.find((f) => f.id === selectedCategory);
    if (!matchedFilter || !matchedFilter.cat) return currentTabItems;
    return currentTabItems.filter((item) => item.category === matchedFilter.cat);
  }, [currentTabItems, selectedCategory]);

  // Unread count
  const unreadCount = useMemo(() => {
    return activeItems.filter((item) => !readState[item.id]).length;
  }, [activeItems, readState]);

  const handleMarkAsRead = (id: string) => {
    setReadState((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#191b20" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>School Notice Board</Text>
          <Text style={styles.headerSub}>Official announcements & archives</Text>
        </View>

        {unreadCount > 0 ? (
          <View style={styles.unreadPill}>
            <View style={styles.unreadDot} />
            <Text style={styles.unreadPillText}>{unreadCount} new</Text>
          </View>
        ) : (
          <View style={styles.allReadPill}>
            <CheckCircle2 size={12} color="#10B981" />
            <Text style={styles.allReadPillText}>Updated</Text>
          </View>
        )}
      </View>

      {/* ── Active vs Archive Tab Toggle ──────────────────────────── */}
      <View style={styles.tabBarWrap}>
        <View style={styles.tabBarContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabItem, activeTab === 'active' && styles.tabItemActive]}
            onPress={() => setActiveTab('active')}
          >
            <Bell size={15} color={activeTab === 'active' ? '#ffffff' : '#6B7280'} />
            <Text
              style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}
            >
              Active ({activeItems.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabItem, activeTab === 'archive' && styles.tabItemActive]}
            onPress={() => setActiveTab('archive')}
          >
            <Archive size={15} color={activeTab === 'archive' ? '#ffffff' : '#6B7280'} />
            <Text
              style={[styles.tabText, activeTab === 'archive' && styles.tabTextActive]}
            >
              Past Archive ({pastItems.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Horizontal Category Filter Chips ──────────────────────── */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {CATEGORY_FILTERS.map((filter) => {
            const isSelected = selectedCategory === filter.id;

            return (
              <TouchableOpacity
                key={filter.id}
                activeOpacity={0.8}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedCategory(filter.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Announcements List ───────────────────────────────────── */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Filter size={32} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No notices found</Text>
          <Text style={styles.emptySub}>
            {activeTab === 'active'
              ? 'There are no active notices for this filter category.'
              : 'There are no past archived notices for this category.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isRead = Boolean(readState[item.id]);
            const isPast = activeTab === 'archive';

            return (
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.card,
                  isPast && styles.pastCard,
                ]}
                onPress={() => setSelectedAnnouncement(item)}
              >
                {/* Left Colored Accent Bar */}
                <View
                  style={[
                    styles.cardAccentBar,
                    { backgroundColor: isPast ? '#9CA3AF' : item.accentColor },
                  ]}
                />

                <View style={styles.cardMainContent}>
                  {/* Category Pill & Status Indicators */}
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: item.badgeBg }]}>
                      <Text style={[styles.categoryBadgeText, { color: item.badgeFg }]}>
                        {item.categoryLabel}
                      </Text>
                    </View>

                    {isPast ? (
                      <View style={styles.expiredBadge}>
                        <Text style={styles.expiredBadgeText}>Expired</Text>
                      </View>
                    ) : !isRead ? (
                      <View style={styles.unreadDotBadge}>
                        <View style={styles.unreadRedDot} />
                        <Text style={styles.unreadDotText}>Unread</Text>
                      </View>
                    ) : (
                      <View style={styles.readBadge}>
                        <CheckCircle2 size={12} color="#10B981" />
                        <Text style={styles.readBadgeText}>Read</Text>
                      </View>
                    )}
                  </View>

                  {/* Title & Subtitle */}
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>

                  {/* Date, Time & Venue Meta Info */}
                  <View style={styles.cardMetaGrid}>
                    <View style={styles.metaRow}>
                      <Calendar size={13} color="#6B7280" />
                      <Text style={styles.metaText}>{item.date}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Clock size={13} color="#6B7280" />
                      <Text style={styles.metaText}>{item.time}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── Full-Screen Expanded View Modal ──────────────────────── */}
      <Modal
        visible={Boolean(selectedAnnouncement)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        {selectedAnnouncement && (
          <View style={[styles.fullModalRoot, { paddingTop: insets.top }]}>
            {/* Top Bar with Category Badge and Close Button */}
            <View style={styles.fullModalTopBar}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: selectedAnnouncement.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.categoryBadgeText,
                    { color: selectedAnnouncement.badgeFg },
                  ]}
                >
                  {selectedAnnouncement.categoryLabel}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.fullCloseBtn}
                onPress={() => setSelectedAnnouncement(null)}
                accessibilityLabel="Close announcement"
              >
                <X size={22} color="#191b20" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Announcement Details Content */}
            <ScrollView
              style={styles.fullScrollView}
              contentContainerStyle={styles.fullScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header Banner Card */}
              <View
                style={[
                  styles.fullBannerCard,
                  { backgroundColor: selectedAnnouncement.cardBg },
                ]}
              >
                <Text style={styles.fullBannerTitle}>
                  {selectedAnnouncement.title}
                </Text>

                <View style={styles.fullBannerMetaGrid}>
                  <View style={styles.fullBannerMetaRow}>
                    <Calendar size={15} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.fullBannerMetaText}>
                      {selectedAnnouncement.date}
                    </Text>
                  </View>

                  <View style={styles.fullBannerMetaRow}>
                    <Clock size={15} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.fullBannerMetaText}>
                      {selectedAnnouncement.time}
                    </Text>
                  </View>

                  <View style={styles.fullBannerMetaRow}>
                    <MapPin size={15} color="rgba(255,255,255,0.85)" />
                    <Text style={styles.fullBannerMetaText}>
                      {selectedAnnouncement.location}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description Section */}
              <View style={styles.fullSectionCard}>
                <View style={styles.fullSectionHeader}>
                  <FileText size={18} color={selectedAnnouncement.accentColor} />
                  <Text style={styles.fullSectionTitle}>Announcement Details</Text>
                </View>

                <Text style={styles.fullDescriptionText}>
                  {selectedAnnouncement.description}
                </Text>
              </View>

              {/* Important Highlights Section */}
              {selectedAnnouncement.highlights && selectedAnnouncement.highlights.length > 0 ? (
                <View style={styles.fullSectionCard}>
                  <View style={styles.fullSectionHeader}>
                    <Award size={18} color={selectedAnnouncement.accentColor} />
                    <Text style={styles.fullSectionTitle}>Important Highlights</Text>
                  </View>

                  {selectedAnnouncement.highlights.map((point, index) => (
                    <View key={index} style={styles.highlightBulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: selectedAnnouncement.accentColor }]} />
                      <Text style={styles.highlightBulletText}>{point}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Organizer Info */}
              <View style={styles.organizerCard}>
                <UserCheck size={16} color="#6B7280" />
                <Text style={styles.organizerText}>
                  Issued by: {selectedAnnouncement.organizer}
                </Text>
              </View>
            </ScrollView>

            {/* Sticky Bottom Action Bar */}
            <View style={[styles.fullBottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {readState[selectedAnnouncement.id] ? (
                <View style={styles.acknowledgedBadge}>
                  <CheckCircle2 size={18} color="#10B981" />
                  <Text style={styles.acknowledgedBadgeText}>Acknowledged & Marked as Read</Text>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.markReadBtn,
                    { backgroundColor: selectedAnnouncement.accentColor },
                  ]}
                  onPress={() => handleMarkAsRead(selectedAnnouncement.id)}
                >
                  <CheckCircle2 size={20} color="#ffffff" strokeWidth={2.2} />
                  <Text style={styles.markReadBtnText}>Mark as Read</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },

  // Top Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#191b20',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFE3E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F1604D',
  },
  allReadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  allReadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },

  // Tab Switcher
  tabBarWrap: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#ffffff',
  },

  // Category Filter Chips
  filterSection: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  filterChipTextSelected: {
    color: '#ffffff',
  },

  // Announcements List
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  pastCard: {
    opacity: 0.75,
    backgroundColor: '#F9FAFB',
  },
  cardAccentBar: {
    width: 6,
  },
  cardMainContent: {
    flex: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  unreadDotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unreadRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  unreadDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  readBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  expiredBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  expiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  cardMetaGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Empty State
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: '80%',
  },

  // Full-Screen Modal Styles
  fullModalRoot: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },
  fullModalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  fullCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScrollView: {
    flex: 1,
  },
  fullScrollContent: {
    padding: 20,
    gap: 16,
  },

  // Full Banner Card
  fullBannerCard: {
    borderRadius: 24,
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fullBannerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 30,
    marginBottom: 16,
  },
  fullBannerMetaGrid: {
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 14,
    borderRadius: 16,
  },
  fullBannerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fullBannerMetaText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Full Section Card
  fullSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  fullSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fullSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191b20',
  },
  fullDescriptionText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
    color: '#374151',
  },

  // Highlights
  highlightBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  highlightBulletText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    lineHeight: 20,
  },

  // Organizer
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  organizerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Bottom Bar
  fullBottomBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
  },
  markReadBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  acknowledgedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    paddingVertical: 15,
  },
  acknowledgedBadgeText: {
    color: '#047857',
    fontSize: 15,
    fontWeight: '800',
  },
});
