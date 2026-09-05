import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { EmployeeService } from '../../services/EmployeeService';
import { AppColors } from '../../screens/theme/AppColors.ts';
import {
  FadeInUp,
  FloatingGeometricOrb,
  SpringTouch,
  ShakeView,
} from '../theme/Animations';

const employeeService = new EmployeeService();

export default function SetPasswordScreen() {
  const navigation = useNavigation<any>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const setPasswordHandler = async () => {
    setErrorText(null);

    if (!password.trim() || !confirmPassword.trim()) return setErrorText('Please enter your password');
    if (password.length < 6) return setErrorText('Password must be at least 6 characters');
    if (password !== confirmPassword) return setErrorText('Passwords do not match');

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData.user;

      let employeeRow = null;
      if (authUser) {
        try {
          employeeRow = await employeeService.getEmployeeByAuthUserId(authUser.id);
        } catch (e) {
          console.warn('⚠️ Error checking employee row:', e);
        }
      }

      setLoading(false);

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
    } catch (e: any) {
      setLoading(false);
      setErrorText(e?.message ?? 'Something went wrong');
    }
  };

  return (
    <View style={styles.container}>
      <FloatingGeometricOrb
        size={220}
        top={-40}
        right={-50}
        color="rgba(91, 77, 248, 0.08)"
        duration={5200}
        floatDistance={12}
      />
      <FloatingGeometricOrb
        size={160}
        bottom={20}
        left={-40}
        color="rgba(16, 185, 129, 0.06)"
        duration={4200}
        floatDistance={10}
      />

      <FadeInUp delay={60} duration={480}>
        <View style={styles.card}>
          <Text style={styles.title}>Activate Account</Text>
          <Text style={styles.subtitle}>Set a secure password for your enterprise workspace account.</Text>

          <FadeInUp delay={120} distance={12}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 6 characters"
              placeholderTextColor={AppColors.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </FadeInUp>

          <FadeInUp delay={180} distance={12}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor={AppColors.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </FadeInUp>

          {errorText ? (
            <ShakeView trigger={errorText}>
              <Text style={styles.errorText}>{errorText}</Text>
            </ShakeView>
          ) : null}

          <FadeInUp delay={240} distance={12}>
            <SpringTouch
              onPress={setPasswordHandler}
              disabled={loading}
              activeScale={0.97}
              style={{ width: '100%' }}
            >
              <View style={[styles.button, loading && { opacity: 0.6 }]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Activate Account</Text>}
              </View>
            </SpringTouch>
          </FadeInUp>
        </View>
      </FadeInUp>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: AppColors.background },
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
  title: { fontSize: 23, fontWeight: '800', textAlign: 'center', color: AppColors.textPrimary, letterSpacing: -0.5 },
  subtitle: { textAlign: 'center', marginTop: 6, marginBottom: 24, color: AppColors.textSecondary, fontSize: 13, fontWeight: '500' },
  label: { fontSize: 12.5, fontWeight: '600', color: AppColors.textPrimary, marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    marginBottom: 16,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.surface,
    fontSize: 13.5,
  },
  errorText: { color: AppColors.danger, marginBottom: 12, textAlign: 'center', fontSize: 12, fontWeight: '500' },
  button: {
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
});