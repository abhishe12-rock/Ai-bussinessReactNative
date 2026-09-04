import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { AppColors } from '../../screens/theme/AppColors.ts';

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="chevron-left" size={28} color={AppColors.primary} />
            </TouchableOpacity>
            <View style={styles.brandIcon}>
              <Icon name="psychology" color="#fff" size={22} />
            </View>
            <Text style={styles.brandTextPrimary}>AI</Text>
            <Text style={styles.brandTextAccent}>Business</Text>
          </View>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Start your AI journey today</Text>

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
            <TouchableOpacity onPress={() => setObscurePassword((v) => !v)}>
              <Icon name={obscurePassword ? 'visibility-off' : 'visibility'} color={AppColors.textMuted} size={18} />
            </TouchableOpacity>
          </View>

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
            <TouchableOpacity onPress={() => setObscureConfirm((v) => !v)}>
              <Icon name={obscureConfirm ? 'visibility-off' : 'visibility'} color={AppColors.textMuted} size={18} />
            </TouchableOpacity>
          </View>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <TouchableOpacity
            style={[styles.signupButton, isLoading && styles.disabledButton]}
            onPress={handleSignUp}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.rowCenter}>
                <Icon name="person-add" color="#fff" size={18} />
                <Text style={styles.signupButtonText}>Create Enterprise Account</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  errorText: { color: AppColors.danger, fontSize: 12, marginBottom: 12, fontWeight: '500' },
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
  loginLink: { fontSize: 13, fontWeight: '700', color: AppColors.secondary },
});