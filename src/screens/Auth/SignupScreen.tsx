import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { AppColors } from '../../screens/theme/AppColors.ts';
import {
  FadeInUp,
  FloatingGeometricOrb,
  SpringTouch,
  ScaleIn,
  ShakeView,
} from '../theme/Animations';

export default function SignupScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [obscureConfirm, setObscureConfirm] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    setErrorText(null);

    if (!trimmedName) return setErrorText('Please enter your full name');
    if (!trimmedEmail) return setErrorText('Please enter your email');
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) return setErrorText('Please enter a valid email');
    if (!trimmedPassword) return setErrorText('Please enter a password');
    if (trimmedPassword.length < 6) return setErrorText('Password must be at least 6 characters');
    if (!trimmedConfirm) return setErrorText('Please confirm your password');
    if (trimmedPassword !== trimmedConfirm) return setErrorText('Passwords do not match');

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: { data: { full_name: trimmedName } },
      });

      setIsLoading(false);

      if (error) return setErrorText(error.message);

      if (data.user) {
        Alert.alert(
          'Account Created!',
          `Welcome ${trimmedName}!\nEmail: ${trimmedEmail}\n\n🎉 Your AI Business account is ready to go.`,
          [{ text: 'Continue to Login', onPress: () => navigation.goBack() }],
        );
      }
    } catch {
      setIsLoading(false);
      setErrorText('Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Ambient Floating Geometric Orbs */}
      <FloatingGeometricOrb
        size={230}
        top={-50}
        right={-60}
        color="rgba(91, 77, 248, 0.08)"
        duration={5500}
        floatDistance={12}
      />
      <FloatingGeometricOrb
        size={170}
        bottom={30}
        left={-50}
        color="rgba(16, 185, 129, 0.06)"
        duration={4500}
        floatDistance={10}
      />
      <FloatingGeometricOrb
        size={100}
        top={140}
        left={-30}
        color="rgba(59, 130, 246, 0.05)"
        duration={3800}
        floatDistance={8}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeInUp delay={60} duration={500}>
          <View style={styles.card}>
            {/* Header with back arrow & brand badge */}
            <View style={styles.headerRow}>
              <SpringTouch
                onPress={() => navigation.goBack()}
                activeScale={0.88}
                style={styles.backBtnWrap}
              >
                <Icon name="chevron-left" size={28} color={AppColors.primary} />
              </SpringTouch>

              <ScaleIn delay={120} bounciness={10}>
                <View style={styles.brandIcon}>
                  <Icon name="psychology" color="#fff" size={22} />
                </View>
              </ScaleIn>

              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTextPrimary}>AI </Text>
                <Text style={styles.brandTextAccent}>Business</Text>
              </View>
            </View>

            <FadeInUp delay={100} distance={12}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start your enterprise AI journey today</Text>
            </FadeInUp>

            {/* Form Fields - Staggered entrance */}
            <FadeInUp delay={150} distance={14}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Icon name="person-outline" color={AppColors.textMuted} size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={AppColors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </FadeInUp>

            <FadeInUp delay={200} distance={14}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="mail-outline" color={AppColors.textMuted} size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="you@aibusiness.ai"
                  placeholderTextColor={AppColors.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </FadeInUp>

            <FadeInUp delay={250} distance={14}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-outline" color={AppColors.textMuted} size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={AppColors.textMuted}
                  secureTextEntry={obscurePassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setObscurePassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name={obscurePassword ? 'visibility-off' : 'visibility'} color={AppColors.textMuted} size={18} />
                </TouchableOpacity>
              </View>
            </FadeInUp>

            <FadeInUp delay={300} distance={14}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock-outline" color={AppColors.textMuted} size={18} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={AppColors.textMuted}
                  secureTextEntry={obscureConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setObscureConfirm((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name={obscureConfirm ? 'visibility-off' : 'visibility'} color={AppColors.textMuted} size={18} />
                </TouchableOpacity>
              </View>
            </FadeInUp>

            {/* Animated Horizontal Shake on Error */}
            {errorText ? (
              <ShakeView trigger={errorText}>
                <View style={styles.errorBanner}>
                  <Icon name="error-outline" color={AppColors.danger} size={16} />
                  <Text style={styles.errorText}>{errorText}</Text>
                </View>
              </ShakeView>
            ) : null}

            {/* Tactile Button with SpringTouch */}
            <FadeInUp delay={340} distance={14}>
              <SpringTouch
                onPress={handleSignUp}
                disabled={isLoading}
                activeScale={0.97}
                style={{ width: '100%' }}
              >
                <View style={[styles.signupButton, isLoading && styles.disabledButton]}>
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.rowCenter}>
                      <Icon name="person-add" color="#fff" size={18} />
                      <Text style={styles.signupButtonText}>Create Enterprise Account</Text>
                    </View>
                  )}
                </View>
              </SpringTouch>
            </FadeInUp>

            <View style={styles.divider} />

            {/* Sign in prompt with SpringTouch */}
            <FadeInUp delay={380} distance={10}>
              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Already have an account?</Text>
                <SpringTouch onPress={() => navigation.goBack()} activeScale={0.92}>
                  <View style={styles.signInPill}>
                    <Text style={styles.loginLink}>Sign In</Text>
                    <Icon name="arrow-forward" size={14} color={AppColors.secondary} />
                  </View>
                </SpringTouch>
              </View>
            </FadeInUp>
          </View>
        </FadeInUp>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 28,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginRight: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  brandTextPrimary: { fontSize: 20, fontWeight: '800', color: AppColors.textPrimary, letterSpacing: -0.4 },
  brandTextAccent: { fontSize: 20, fontWeight: '800', color: AppColors.secondary, letterSpacing: -0.4 },
  title: { fontSize: 23, fontWeight: '800', color: AppColors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: AppColors.textSecondary, marginTop: 4, marginBottom: 22, fontWeight: '500' },
  label: { fontSize: 12.5, fontWeight: '600', color: AppColors.textPrimary, marginBottom: 7 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 48,
  },
  input: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary, fontSize: 13.5 },
  backBtnWrap: { padding: 4 },
  brandTitleRow: { flexDirection: 'row', alignItems: 'center' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
    gap: 8,
  },
  errorText: { color: AppColors.danger, fontSize: 12, fontWeight: '600', flex: 1 },
  signupButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: { opacity: 0.6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  signupButtonText: { color: '#fff', fontSize: 14.5, fontWeight: '700', marginLeft: 8 },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 20 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginPrompt: { fontSize: 12.5, color: AppColors.textSecondary, marginRight: 6, fontWeight: '500' },
  signInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.secondarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  loginLink: { fontSize: 13, fontWeight: '700', color: AppColors.secondary },
});