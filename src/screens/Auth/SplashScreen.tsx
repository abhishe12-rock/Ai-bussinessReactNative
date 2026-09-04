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
      <View style={styles.brandIconWrap}>
        <View style={styles.brandIconGlow} />
        <View style={styles.brandIcon}>
          <Icon name="psychology" color="#fff" size={42} />
        </View>
      </View>
      <View style={styles.brandRow}>
        <Text style={styles.brandTextPrimary}>AI </Text>
        <Text style={styles.brandTextAccent}>Business</Text>
      </View>
      <Text style={styles.tagline}>Quantum Enterprise AI Platform</Text>
      <ActivityIndicator color={AppColors.primary} style={{ marginTop: 36 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandIconWrap: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconGlow: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 36,
    backgroundColor: AppColors.primary,
    opacity: 0.28,
  },
  brandIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 22,
    elevation: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextPrimary: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  },
  brandTextAccent: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.secondary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 12.5,
    fontWeight: '500',
    color: AppColors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.4,
  },
});