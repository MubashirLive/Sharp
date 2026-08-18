import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  InteractionManager,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MessageSquareCode } from 'lucide-react-native';
import { Text as RNText } from 'react-native';

const OTP_LENGTH = 4;
const RESEND_TIMEOUT = 30;

// Colors from our design system
const COLORS = {
  primary: '#000000',
  primaryLight: 'rgba(90, 200, 250, 0.10)',
  primaryBorder: 'rgba(90, 200, 250, 0.20)',
  onSurface: '#000000',
  onSurfaceVariant: 'rgba(60,60,67,0.60)',
  surface: '#F9F9FB',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHigh: '#F0F0F3',
  outlineVariant: '#C6C6C8',
  outlineVariantHalf: 'rgba(198, 198, 200, 0.5)',
  secondary: '#8E8E93',
  secondaryLight: 'rgba(142, 142, 147, 0.1)',
  onPrimary: '#ffffff',
  outline: '#8E8E93',
  dark: '#1B8CC4',
};

export default function OTPScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [phoneNumber] = useState('your number');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(RESEND_TIMEOUT);
  const [hasNavigated, setHasNavigated] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResend = () => {
    setOtp('');
    setTimer(RESEND_TIMEOUT);
    setHasNavigated(false);
    inputRef.current?.focus();
  };

  const navigateToProfiles = useCallback(() => {
    if (hasNavigated) return;
    setHasNavigated(true);
    InteractionManager.runAfterInteractions(() => {
      router.push('/profiles');
    });
  }, [hasNavigated, router]);

  const handleOtpChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9]/g, '');
      setOtp(cleaned);
      if (cleaned.length === OTP_LENGTH) {
        setTimeout(() => {
          navigateToProfiles();
        }, 300);
      }
    },
    [navigateToProfiles]
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    }
  };

  const isVerifyEnabled = otp.length === OTP_LENGTH;

  return (
    <View style={[styles.flex1, { backgroundColor: COLORS.surface }]}>  
      {/* TopAppBar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top, height: 72 + insets.top },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={COLORS.dark} />
        </TouchableOpacity>

        <View style={[styles.titleContainer, { top: insets.top + 24 }]}>
          <RNText style={styles.titleText}>Verification</RNText>
        </View>

        <View style={styles.spacer} />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.iconCircle}>
            <MessageSquareCode size={36} color={COLORS.dark} />
          </View>
          <RNText style={styles.heroTitle}>Enter Verification Code</RNText>
          <RNText style={styles.heroSubtitle}>
            We've sent a 4-digit code to
          </RNText>
          <View style={styles.phoneRow}>
            <RNText style={styles.phoneText}>+91 {phoneNumber}</RNText>
            <TouchableOpacity onPress={handleBack}>
              <RNText style={styles.editLink}>Edit Number</RNText>
            </TouchableOpacity>
          </View>
        </View>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={handleOtpChange}
            maxLength={OTP_LENGTH}
            keyboardType="number-pad"
            autoFocus
            style={styles.hiddenInput}
          />

          <Pressable
            onPress={() => inputRef.current?.focus()}
            style={styles.otpBoxRow}
          >
            {[...Array(OTP_LENGTH)].map((_, index) => {
              const digit = otp[index] || '';
              const isFocused =
                otp.length === index ||
                (otp.length === OTP_LENGTH && index === OTP_LENGTH - 1);

              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    isFocused
                      ? styles.otpBoxFocused
                      : digit
                        ? styles.otpBoxFilled
                        : styles.otpBoxEmpty,
                  ]}
                >
                  <RNText style={styles.otpDigit}>{digit}</RNText>
                </View>
              );
            })}
          </Pressable>
        </View>

        {/* Resend Logic */}
        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <RNText style={styles.resendTimerText}>
              Resend code in{' '}
              <RNText style={styles.resendTimerBold}>
                00:{timer.toString().padStart(2, '0')}
              </RNText>
            </RNText>
          ) : (
            <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
              <RNText style={styles.resendButtonText}>
                Resend Verification Code
              </RNText>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <TouchableOpacity
          onPress={navigateToProfiles}
          disabled={!isVerifyEnabled}
          activeOpacity={0.8}
          style={[
            styles.verifyButton,
            { opacity: isVerifyEnabled ? 1 : 0.5 },
          ]}
        >
          <RNText style={styles.verifyButtonText}>Verify & Login</RNText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    zIndex: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  titleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    color: COLORS.primary,
  },
  spacer: { width: 48 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  heroContainer: { alignItems: 'center', marginTop: 16, marginBottom: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.onSurfaceVariant,
    textAlign: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  phoneText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginRight: 8,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    textDecorationLine: 'underline',
  },
  otpContainer: { marginTop: 16, marginBottom: 32 },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    fontSize: 1,
  },
  otpBoxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  otpBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  otpBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surfaceContainerLowest,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  otpBoxFilled: {
    borderColor: COLORS.outlineVariant,
    backgroundColor: COLORS.surface,
  },
  otpBoxEmpty: {
    borderColor: COLORS.outlineVariantHalf,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  otpDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  resendContainer: { alignItems: 'center' },
  resendTimerText: { fontSize: 14, color: COLORS.onSurfaceVariant },
  resendTimerBold: { fontWeight: '700', color: COLORS.primary },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.secondaryLight,
  },
  resendButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHigh,
  },
  verifyButton: {
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  verifyButtonText: {
    color: COLORS.onPrimary,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});

