import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Bell,
  ChevronRight,
  UserCheck,
  Trophy,
  Award,
  Compass,
  FileText,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTAINER_PADDING = 40; // 20px padding on left & right of parent scrollContent
const CARD_GAP = 12;
const CARD_WIDTH = SCREEN_WIDTH - CONTAINER_PADDING;

export type AnnouncementCategory = 'PTM' | 'SPORTS' | 'RESULTS' | 'TOUR' | 'NOTICE';

export type AnnouncementItem = {
  id: string;
  category: AnnouncementCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  description: string;
  date: string;
  time: string;
  location: string;
  accentColor: string;
  cardBg: string;
  badgeBg: string;
  badgeFg: string;
  expiryDate: string; // YYYY-MM-DD
  highlights: string[];
  organizer: string;
};

export const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-1',
    category: 'PTM',
    categoryLabel: '📢 PTM Meeting',
    title: 'Q1 Parent-Teacher Meeting',
    subtitle: 'Discuss student progress & first term performance report with class teacher.',
    description:
      'The Quarter 1 Parent-Teacher Meeting is scheduled to review student academic progress, attendance records, and personal development goals. Teachers will share detailed insights and answer parent queries.',
    date: 'Friday, 14 August 2026',
    time: '9:00 AM - 1:00 PM',
    location: 'Classroom 204 & Main Block',
    accentColor: '#D97706',
    cardBg: '#1C1917',
    badgeBg: '#FEF3C7',
    badgeFg: '#B45309',
    expiryDate: '2026-08-15',
    highlights: [
      'Individual 10-minute slots assigned per student',
      'Report card distribution & teacher feedback',
      'Specialist subjects consultation available in Lab Block',
    ],
    organizer: 'School Management & Faculty Board',
  },
  {
    id: 'ann-2',
    category: 'SPORTS',
    categoryLabel: '🏆 Annual Sports',
    title: 'Annual Sports Celebration 2026',
    subtitle: 'Track events, inter-house relay races, and trophy awards ceremony.',
    description:
      'Join us for the Annual Sports Meet celebrating athleticism, teamwork, and sportsmanship! Students across all grades will compete in track and field events, relay races, and house championships.',
    date: 'Thursday, 20 August 2026',
    time: '8:00 AM - 3:30 PM',
    location: 'St. Xavier Main Stadium Ground',
    accentColor: '#059669',
    cardBg: '#064E3B',
    badgeBg: '#D1FAE5',
    badgeFg: '#047857',
    expiryDate: '2026-08-21',
    highlights: [
      'All house teams (Red, Blue, Green, Yellow) marching parade',
      'Parents invited to witness finals & award distribution at 2:30 PM',
      'Students must carry official sports uniform & water bottle',
    ],
    organizer: 'Department of Physical Education',
  },
  {
    id: 'ann-3',
    category: 'RESULTS',
    categoryLabel: '📊 Term Results',
    title: 'Mid-Term Examination Results',
    subtitle: 'Official term marks statement & performance review published.',
    description:
      'The Mid-Term examination results for Class 8 to Class 12 will be declared online and accessible via the student portal. Detailed subject-wise breakdown and rank statements will be released.',
    date: 'Tuesday, 25 August 2026',
    time: '10:00 AM Onwards',
    location: 'Parent Portal & Admin Office',
    accentColor: '#4F46E5',
    cardBg: '#1E1B4B',
    badgeBg: '#E0E7FF',
    badgeFg: '#4338CA',
    expiryDate: '2026-08-26',
    highlights: [
      'Digital report card PDF available for download in portal',
      'Re-evaluation request window open till 28 August 2026',
      'Parent signature required on printed marksheet copy',
    ],
    organizer: 'Examination Controller Committee',
  },
  {
    id: 'ann-4',
    category: 'TOUR',
    categoryLabel: '🚌 School Tour',
    title: 'Science & Planetarium Field Tour',
    subtitle: 'Educational visit to Science City & Space Observatory Dome.',
    description:
      'An exciting educational field trip for Grade 9 & 10 students to explore interactive science exhibits, 3D astronomy planetarium shows, and robotic engineering workshops.',
    date: 'Friday, 28 August 2026',
    time: '7:30 AM - 4:00 PM',
    location: 'National Science Center & Observatory',
    accentColor: '#DB2777',
    cardBg: '#831843',
    badgeBg: '#FCE7F3',
    badgeFg: '#BE185D',
    expiryDate: '2026-08-29',
    highlights: [
      'School bus transport & morning snacks provided',
      'Permission slip consent form due by 22 August',
      'Guided tour by senior science faculty members',
    ],
    organizer: 'Science Club & Student Tour Coordinators',
  },
  {
    id: 'ann-past-1',
    category: 'NOTICE',
    categoryLabel: '📋 General Notice',
    title: 'New Academic Year Orientation',
    subtitle: 'Welcoming student orientation & curriculum briefing session.',
    description:
      'Welcome assembly for all new and returning students introducing class teacher assignments, safety guidelines, and school timetable schedule for Academic Year 2026-27.',
    date: 'Monday, 14 July 2026',
    time: '8:30 AM - 11:30 AM',
    location: 'School Main Auditorium',
    accentColor: '#6B7280',
    cardBg: '#1F2937',
    badgeBg: '#F3F4F6',
    badgeFg: '#374151',
    expiryDate: '2026-07-15',
    highlights: [
      'Distribution of school diary & student handbook',
      'Introduction of student council leadership',
    ],
    organizer: 'Academic Directorate',
  },
  {
    id: 'ann-past-2',
    category: 'SPORTS',
    categoryLabel: '🏆 Inter-School',
    title: 'Regional Badminton Tournament',
    subtitle: 'Inter-school championship finals & felicitation.',
    description:
      'St. Xavier senior boys and girls badminton teams competed in the regional inter-school cup championship, securing 1st rank in doubles event.',
    date: 'Wednesday, 22 July 2026',
    time: '9:00 AM - 2:00 PM',
    location: 'District Sports Complex Arena',
    accentColor: '#059669',
    cardBg: '#064E3B',
    badgeBg: '#D1FAE5',
    badgeFg: '#047857',
    expiryDate: '2026-07-23',
    highlights: ['Gold medal trophy won in Boys U-17 Doubles', 'Silver medal won in Girls Singles'],
    organizer: 'Sports & Athletics Committee',
  },
];

export function AnnouncementCarousel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [readState, setReadState] = useState<Record<string, boolean>>({});
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Today date formatted YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  // Filter out expired announcements automatically
  const activeAnnouncements = useMemo(() => {
    return INITIAL_ANNOUNCEMENTS.filter((item) => item.expiryDate >= todayStr);
  }, [todayStr]);

  // Compute unread count
  const unreadCount = useMemo(() => {
    return activeAnnouncements.filter((item) => !readState[item.id]).length;
  }, [activeAnnouncements, readState]);

  // Auto-scroll Timer (~4.5s)
  useEffect(() => {
    if (activeAnnouncements.length <= 1 || isPaused || selectedAnnouncement !== null) return;

    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % activeAnnouncements.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [activeAnnouncements.length, isPaused, selectedAnnouncement]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CARD_WIDTH + CARD_GAP));
    if (index >= 0 && index < activeAnnouncements.length) {
      setActiveIndex(index);
    }
  };

  const handleMarkAsRead = (id: string) => {
    setReadState((prev) => ({ ...prev, [id]: true }));
  };

  if (activeAnnouncements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <CheckCircle2 size={24} color="#10B981" />
        <Text style={styles.emptyTitle}>You're all caught up! ✨</Text>
        <Text style={styles.emptySub}>No active school announcements today.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Section Header Row ──────────────────────────────────── */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <View style={styles.unreadDot} />
              <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
            </View>
          ) : (
            <View style={styles.allReadBadge}>
              <CheckCircle2 size={12} color="#10B981" />
              <Text style={styles.allReadText}>All read</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.seeAllBtn}
          onPress={() => router.push('/announcements')}
        >
          <Text style={styles.seeAllText}>View all</Text>
          <ChevronRight size={14} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* ── Carousel Slider ──────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={activeAnnouncements}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => setIsPaused(true)}
        onScrollEndDrag={() => setIsPaused(false)}
        contentContainerStyle={styles.carouselList}
        renderItem={({ item }) => {
          const isRead = Boolean(readState[item.id]);

          return (
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.card, { backgroundColor: item.cardBg }]}
              onPress={() => setSelectedAnnouncement(item)}
            >
              {/* Category Pill & Unread Status */}
              <View style={styles.cardHeaderRow}>
                <View style={[styles.categoryBadge, { backgroundColor: item.badgeBg }]}>
                  <Text style={[styles.categoryBadgeText, { color: item.badgeFg }]}>
                    {item.categoryLabel}
                  </Text>
                </View>

                {!isRead && <View style={styles.cardUnreadDot} />}
              </View>

              {/* Title & Subtitle */}
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>

              {/* Bottom Info Row */}
              <View style={styles.cardFooter}>
                <View style={styles.cardMetaItem}>
                  <Calendar size={13} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.cardMetaText}>{item.date.split(',')[1]?.trim() || item.date}</Text>
                </View>

                <View style={styles.cardActionPill}>
                  <Text style={styles.cardActionText}>View Details</Text>
                  <ChevronRight size={13} color="#000000" strokeWidth={2.5} />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Pagination Dot Indicators ────────────────────────────── */}
      {activeAnnouncements.length > 1 && (
        <View style={styles.paginationDots}>
          {activeAnnouncements.map((item, index) => {
            const isActive = index === activeIndex;

            return (
              <View
                key={item.id}
                style={[
                  styles.dot,
                  isActive && styles.activeDot,
                  isActive && { backgroundColor: activeAnnouncements[index].accentColor },
                ]}
              />
            );
          })}
        </View>
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
    marginTop: 8,
    marginBottom: 4,
  },

  // Empty State
  emptyContainer: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#191b20',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#707884',
    marginTop: 2,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  unreadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFE3E1',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F1604D',
  },
  allReadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  allReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },

  // Carousel Cards
  carouselList: {
    paddingHorizontal: 0,
  },
  card: {
    width: CARD_WIDTH,
    height: 175,
    borderRadius: 24,
    padding: 18,
    justifyContent: 'space-between',
    marginRight: CARD_GAP,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardUnreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 17,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardMetaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cardActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  cardActionText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#000000',
  },

  // Pagination Dots
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  activeDot: {
    width: 18,
    height: 6,
    borderRadius: 3,
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
