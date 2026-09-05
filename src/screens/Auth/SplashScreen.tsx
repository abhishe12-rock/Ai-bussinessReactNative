import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '../../lib/supabase';
import { EmployeeService } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';
import {
  FadeInUp,
  ScaleIn,
  FloatingGeometricOrb,
  PulseRing,
  BreathingView,
  PulsingGlow,
} from '../theme/Animations';

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
      {/* Background ambient orbs */}
      <FloatingGeometricOrb
        size={260}
        top={-60}
        right={-70}
        color="rgba(91, 77, 248, 0.09)"
        duration={5800}
        floatDistance={14}
      />
      <FloatingGeometricOrb
        size={200}
        bottom={-40}
        left={-60}
        color="rgba(59, 130, 246, 0.07)"
        duration={4800}
        floatDistance={12}
      />

      {/* Pulsing Concentric Radar Rings & Central Brand Icon */}
      <View style={styles.brandIconWrap}>
        <PulseRing size={100} color={AppColors.primary} maxScale={2.2} duration={2200} />
        <ScaleIn delay={100} initialScale={0.5} bounciness={12}>
          <BreathingView duration={2600} minScale={0.96} maxScale={1.04}>
            <View style={styles.brandIcon}>
              <Icon name="psychology" color="#fff" size={44} />
            </View>
          </BreathingView>
        </ScaleIn>
      </View>

      {/* Brand Title & Tagline with Staggered Entrance */}
      <FadeInUp delay={250} distance={16}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTextPrimary}>AI </Text>
          <Text style={styles.brandTextAccent}>Business</Text>
        </View>
      </FadeInUp>

      <FadeInUp delay={380} distance={12}>
        <Text style={styles.tagline}>Quantum Enterprise AI Platform</Text>
      </FadeInUp>

      {/* High-tech session status pill */}
      <FadeInUp delay={500} distance={10}>
        <View style={styles.loadingPill}>
          <PulsingGlow color={AppColors.primary} size={6} glowRadius={14} />
          <Text style={styles.loadingText}>INITIALIZING WORKSPACE</Text>
        </View>
      </FadeInUp>
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
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },
  brandIcon: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTextPrimary: {
    fontSize: 30,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.6,
  },
  brandTextAccent: {
    fontSize: 30,
    fontWeight: '800',
    color: AppColors.secondary,
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  loadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 77, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(91, 77, 248, 0.18)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 36,
    gap: 8,
  },
  loadingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: AppColors.primary,
    letterSpacing: 0.8,
  },
});