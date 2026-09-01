import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { EmployeeService } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const employeeService = new EmployeeService();

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        return;
      }

      const authUser = session.user;

      let employeeRow = null;
      try {
        employeeRow = await employeeService.getEmployeeByAuthUserId(authUser.id);
      } catch {
        employeeRow = null;
      }

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
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.brandIcon}>
        <Icon name="psychology" color="#fff" size={40} />
      </View>
      <View style={styles.brandRow}>
        <Text style={styles.brandTextPrimary}>AI</Text>
        <Text style={styles.brandTextAccent}>Business</Text>
      </View>
      <ActivityIndicator color={AppColors.primary} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background, alignItems: 'center', justifyContent: 'center' },
  brandIcon: {
    width: 84, height: 84, borderRadius: 24, backgroundColor: AppColors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  brandRow: { flexDirection: 'row' },
  brandTextPrimary: { fontSize: 28, fontWeight: '700', color: AppColors.textPrimary },
  brandTextAccent: { fontSize: 28, fontWeight: '700', color: AppColors.primary },
});