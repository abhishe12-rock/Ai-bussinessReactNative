import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../../lib/supabase';
import { EmployeeService } from '../../services/EmployeeService';
import { AppColors } from '../../screens/theme/AppColors';
import { FadeInUp, FloatingGeometricOrb, SpringTouch, PulsingGlow } from '../theme/Animations';

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  Dashboard: { allowedModules?: Record<string, boolean>; employeeName?: string; employeeId?: string };
};

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const employeeService = new EmployeeService();

export default function LoginScreen() {
  const navigation = useNavigation<Nav>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const showError = (message: string) => setErrorText(message);

  const handleLogin = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    setErrorText(null);

    if (!trimmedEmail) return showError('Please enter your email');
    if (!trimmedEmail.includes('@')) return showError('Please enter a valid email');
    if (!trimmedPassword) return showError('Please enter your password');

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email not confirmed') || msg.includes('email not verified')) {
          showError('Please confirm your email before logging in.');
        } else {
          showError(error.message);
        }
        setIsLoading(false);
        return;
      }

      const authUser = data.user;
      if (!authUser) {
        showError('Login failed. User not found.');
        setIsLoading(false);
        return;
      }

      let employeeRow = null;
      try {
        employeeRow = await employeeService.getEmployeeByAuthUserId(authUser.id);
      } catch {
        employeeRow = null;
      }

      setIsLoading(false);

      if (employeeRow) {
        const employeeId = employeeRow.id as string;
        const roleId = await employeeService.getEmployeeRole(employeeId);
        const permissions = roleId ? await employeeService.getRolePermissions(roleId) : {};

        navigation.reset({
          index: 0,
          routes: [{
            name: 'Dashboard',
            params: {
              allowedModules: permissions,
              employeeName: (employeeRow.full_name as string) ?? 'Employee',
              employeeId,
            },
          }],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
      }
    } catch {
      setIsLoading(false);
      showError('Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Background Floating Geometric Orbs */}
      <FloatingGeometricOrb
        size={220}
        top={-50}
        right={-60}
        color="rgba(91, 77, 248, 0.08)"
        duration={5500}
        floatDistance={12}
      />
      <FloatingGeometricOrb
        size={160}
        bottom={40}
        left={-50}
        color="rgba(124, 58, 237, 0.06)"
        duration={4200}
        floatDistance={10}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <FadeInUp delay={80}>
          <View style={styles.card}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <MaterialIcons name="psychology" color="#fff" size={24} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.brandTextPrimary}>AI </Text>
                  <Text style={styles.brandTextAccent}>Business</Text>
                </View>
                <Text style={styles.brandTagline}>Autonomous Enterprise Suite</Text>
              </View>
            </View>

            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your enterprise workspace</Text>

            <Text style={styles.label}>Work Email</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="mail-outline" color={AppColors.textMuted} size={18} />
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

            <View style={styles.passwordHeaderRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity style={styles.forgotLink}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="vpn-key" color={AppColors.textMuted} size={18} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={AppColors.textMuted}
                secureTextEntry={obscurePassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setObscurePassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name={obscurePassword ? 'visibility-off' : 'visibility'} color={AppColors.textMuted} size={18} />
              </TouchableOpacity>
            </View>

            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <SpringTouch
              onPress={handleLogin}
              disabled={isLoading}
              activeScale={0.97}
              style={{ width: '100%' }}
            >
              <View style={[styles.loginButton, isLoading && styles.disabledButton]}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.rowCenter}>
                    <MaterialIcons name="login" color="#fff" size={18} />
                    <Text style={styles.loginButtonText}>Sign In to Workspace</Text>
                  </View>
                )}
              </View>
            </SpringTouch>

            <View style={styles.divider} />

            <View style={styles.signupBlock}>
              <Text style={styles.signupPrompt}>New to AI Business?</Text>
              <SpringTouch
                onPress={() => navigation.navigate('Signup')}
                activeScale={0.94}
              >
                <View style={styles.signupPill}>
                  <MaterialIcons name="person-add-alt-1" color={AppColors.primary} size={16} />
                  <Text style={styles.signupPillText}>Create account</Text>
                </View>
              </SpringTouch>
            </View>
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
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 28,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 6,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  brandIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  brandTextPrimary: { fontSize: 20, fontWeight: '800', color: AppColors.textPrimary, letterSpacing: -0.4 },
  brandTextAccent: { fontSize: 20, fontWeight: '800', color: AppColors.secondary, letterSpacing: -0.4 },
  brandTagline: { fontSize: 11, color: AppColors.textSecondary, marginTop: 1, fontWeight: '500' },
  title: { fontSize: 23, fontWeight: '800', color: AppColors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: AppColors.textSecondary, marginTop: 4, marginBottom: 22, fontWeight: '500' },
  passwordHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12.5, fontWeight: '600', color: AppColors.textPrimary, marginBottom: 7 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
  },
  input: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary, fontSize: 13.5 },
  errorText: { color: AppColors.danger, fontSize: 12, marginBottom: 12, fontWeight: '500' },
  forgotLink: { alignSelf: 'flex-end' },
  forgotText: { fontSize: 12, color: AppColors.secondary, fontWeight: '600' },
  loginButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 5,
  },
  disabledButton: { opacity: 0.6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 14.5, fontWeight: '700', marginLeft: 8 },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 22 },
  signupBlock: { alignItems: 'center' },
  signupPrompt: { fontSize: 12.5, color: AppColors.textSecondary, marginBottom: 10, fontWeight: '500' },
  signupPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${AppColors.primary}35`,
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  signupPillText: { fontSize: 13, fontWeight: '600', color: AppColors.textPrimary, marginLeft: 8 },
});