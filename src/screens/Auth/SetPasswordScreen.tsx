import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { EmployeeService } from '../../services/EmployeeService';
import { AppColors } from '../../screens/theme/AppColors.ts';

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
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Create your password to activate your employee account.</Text>

      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

      <TouchableOpacity style={[styles.button, loading && { opacity: 0.6 }]} onPress={setPasswordHandler} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: AppColors.background },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', color: AppColors.textPrimary },
  subtitle: { textAlign: 'center', marginTop: 10, marginBottom: 30, color: AppColors.textSecondary },
  input: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 12, padding: 14, marginBottom: 16, color: AppColors.textPrimary },
  errorText: { color: AppColors.danger, marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: AppColors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});