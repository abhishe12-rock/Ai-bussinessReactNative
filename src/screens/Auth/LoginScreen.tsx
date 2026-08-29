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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <MaterialIcons name="psychology" color="#fff" size={26} />
            </View>
            <Text style={styles.brandTextPrimary}>AI</Text>
            <Text style={styles.brandTextAccent}>Business</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <View style={styles.subtitleRow}>
            <MaterialIcons name="arrow-forward" color={AppColors.primary} size={16} />
            <Text style={styles.subtitle}>Sign in to your AI workspace</Text>
          </View>

          <Text style={styles.label}>Email</Text>
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

          <Text style={styles.label}>Password</Text>
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
            <TouchableOpacity onPress={() => setObscurePassword((v) => !v)}>
              <MaterialIcons name={obscurePassword ? 'visibility-off' : 'visibility'} color={AppColors.textMuted} size={18} />
            </TouchableOpacity>
          </View>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          <TouchableOpacity style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.rowCenter}>
                <MaterialIcons name="login" color="#fff" size={20} />
                <Text style={styles.loginButtonText}>Log In</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.signupBlock}>
            <Text style={styles.signupPrompt}>New to AI Business?</Text>
            <TouchableOpacity style={styles.signupPill} onPress={() => navigation.navigate('Signup')}>
              <MaterialIcons name="person-add-alt-1" color={AppColors.primary} size={18} />
              <Text style={styles.signupPillText}>Create new account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: AppColors.surface, borderRadius: 32, padding: 28,
    maxWidth: 420, width: '100%', alignSelf: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  brandIcon: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: AppColors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  brandTextPrimary: { fontSize: 24, fontWeight: '700', color: AppColors.textPrimary },
  brandTextAccent: { fontSize: 24, fontWeight: '700', color: AppColors.primary },
  title: { fontSize: 28, fontWeight: '700', color: AppColors.textPrimary },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, marginBottom: 24 },
  subtitle: { fontSize: 15, color: AppColors.textSecondary, marginLeft: 6 },
  label: { fontSize: 14, fontWeight: '500', color: AppColors.textPrimary, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surfaceSoft,
    borderRadius: 18, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginBottom: 18,
  },
  input: { flex: 1, paddingVertical: 14, marginLeft: 8, color: AppColors.textPrimary },
  errorText: { color: AppColors.danger, fontSize: 13, marginBottom: 8 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 16 },
  forgotText: { fontSize: 14, color: AppColors.textSecondary },
  loginButton: { backgroundColor: AppColors.primary, borderRadius: 32, paddingVertical: 16, alignItems: 'center' },
  disabledButton: { opacity: 0.6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 17, fontWeight: '600', marginLeft: 10 },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 22 },
  signupBlock: { alignItems: 'center' },
  signupPrompt: { fontSize: 15, color: AppColors.textSecondary, marginBottom: 12 },
  signupPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primarySoft,
    borderRadius: 32, paddingVertical: 12, paddingHorizontal: 28,
  },
  signupPillText: { fontSize: 15, fontWeight: '500', color: AppColors.textPrimary, marginLeft: 10 },
});