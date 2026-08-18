import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, TypeScale, type ThemeColor, type TypeStyle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /**
   * Apple Dynamic Type style.
   * Replaces the old `type` prop — all new code should use these.
   */
  type?: TypeStyle | 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  // Resolve color
  const color = theme[themeColor ?? 'label'];

  // Resolve typography style
  const typeStyle = resolveTypeStyle(type, theme);

  return (
    <Text
      style={[{ color }, typeStyle, style]}
      {...rest}
    />
  );
}

/**
 * Maps a type prop to a concrete style object.
 * Supports both the new Apple type scale AND legacy type names for backwards compat.
 */
function resolveTypeStyle(type: ThemedTextProps['type'], theme: ReturnType<typeof useTheme>) {
  // ── New Apple type scale ────────────────────────────────────────────
  if (type && type in TypeScale) {
    return TypeScale[type as TypeStyle];
  }

  // ── Legacy compatibility ───────────────────────────────────────────
  switch (type) {
    case 'default':
      return TypeScale.body;
    case 'title':
      return TypeScale.largeTitle;
    case 'subtitle':
      return TypeScale.title2;
    case 'small':
      return TypeScale.footnote;
    case 'smallBold':
      return styles.smallBold;
    case 'link':
      return styles.link;
    case 'linkPrimary':
      return styles.linkPrimary;
    case 'code':
      return styles.code;
    default:
      return TypeScale.body;
  }
}

const styles = StyleSheet.create({
  smallBold: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: -0.08,
  },
  link: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  linkPrimary: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.24,
    color: '#000000',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: '700' }) ?? '500',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
});
