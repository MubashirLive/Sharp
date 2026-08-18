/**
 * AttachmentPanel — bottom sheet grid for attachment type selection.
 * Used by: ChatDetailScreen, GroupChatScreen
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Camera, FileText, Image, MapPin, UserRound } from 'lucide-react-native';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

const ITEMS = [
  { label: 'Document', Icon: FileText,   color: '#7c4dff' },
  { label: 'Gallery',  Icon: Image,      color: '#d63384' },
  { label: 'Camera',   Icon: Camera,     color: '#ff7043' },
  { label: 'Location', Icon: MapPin,     color: '#20c997' },
  { label: 'Contact',  Icon: UserRound,  color: '#00a884' },
] as const;

type Props = {
  onSelect?: (label: string) => void;
};

export default function AttachmentPanel({ onSelect }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.grabber} />
      <View style={styles.grid}>
        {ITEMS.map(({ label, Icon, color }) => (
          <Pressable
            key={label}
            style={styles.item}
            onPress={() => onSelect?.(label)}
          >
            <View style={[styles.iconBox, { backgroundColor: color }]}>
              <Icon size={24} color="#ffffff" strokeWidth={2.2} />
            </View>
            <Text style={styles.label}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 220,
    backgroundColor: ChatColors.bgPanel,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a484f',
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 22,
  },
  item: {
    width: '25%',
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#d6dee3',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
