import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, PayrollRecord } from '../../services/EmployeeService';
import { AppColors, AppShadows, AppRadius } from '../theme/AppColors';
import { FadeInUp, SpringTouch, PulsingGlow } from '../theme/Animations';

const service = new EmployeeService();
const MONTHS = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function PayrollScreen() {
  const navigation = useNavigation<any>();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPayroll(await service.getPayroll(new Date()));
    } catch (e: any) {
      setError(`Failed to load payroll: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markPaid = async (p: PayrollRecord) => {
    try {
      await service.markPayrollPaid(p.id);
      load();
    } catch (e: any) {
      Alert.alert('Failed', String(e.message ?? e));
    }
  };

  const now = new Date();
  const monthLabel = `${MONTHS[now.getMonth() + 1]} ${now.getFullYear()}`;
  const totalNet = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const pendingCount = payroll.filter((p) => p.paymentStatus === 'PENDING').length;

  return (
    <View style={styles.flex}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back-ios" color={AppColors.textPrimary} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payroll</Text>
        </View>

        <View style={styles.headerRight}>
          <SpringTouch
            onPress={() => navigation.navigate('PayrollCalculation')}
            activeScale={0.95}
          >
            <View style={styles.calcBtn}>
              <Icon name="calculate" size={20} color="#FFFFFF" />
              <Text style={styles.calcBtnText}>Calculate</Text>
            </View>
          </SpringTouch>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={AppColors.primary}
          />
        }
      >
        {/* MONTH HEADER */}
        <FadeInUp delay={20}>
          <View style={styles.monthBadgeRow}>
            <View style={styles.monthBadge}>
              <Icon name="calendar-today" size={14} color={AppColors.primary} />
              <Text style={styles.monthBadgeText}>{monthLabel}</Text>
            </View>
          </View>
        </FadeInUp>

        {/* 2 STAT CARDS */}
        <View style={styles.statsRow}>
          <FadeInUp delay={60} style={{ flex: 1 }}>
            <SpringTouch style={styles.statCard} activeScale={0.96}>
              <View style={[styles.statIconWrap, { backgroundColor: '#EEECFE' }]}>
                <Icon name="payments" size={18} color="#5B4DF8" />
              </View>
              <Text style={styles.statLabel}>Total Payroll</Text>
              <Text style={styles.statValue}>
                ₹{totalNet.toLocaleString('en-IN')}
              </Text>
            </SpringTouch>
          </FadeInUp>

          <FadeInUp delay={120} style={{ flex: 1 }}>
            <SpringTouch style={styles.statCard} activeScale={0.96}>
              <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <Icon name="schedule" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.statLabel}>Pending Disbursal</Text>
              <Text style={styles.statValue}>{pendingCount} Staff</Text>
            </SpringTouch>
          </FadeInUp>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Employee Records</Text>
          <Text style={styles.resultsCount}>{payroll.length} records</Text>
        </View>

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.emptySubtitle}>Loading records...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Text style={{ color: AppColors.danger, fontSize: 13 }}>{error}</Text>
          </View>
        ) : payroll.length === 0 ? (
          <View style={styles.centerFill}>
            <View style={styles.emptyIconCircle}>
              <Icon name="receipt-long" size={32} color={AppColors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No payroll records for this month</Text>
            <Text style={styles.emptySubtitle}>
              Tap 'Calculate' to generate this month's salary records.
            </Text>
          </View>
        ) : (
          payroll.map((p, idx) => {
            const paid = p.paymentStatus === 'PAID';
            const firstLetter = (p.employeeName || 'E').charAt(0).toUpperCase();

            return (
              <FadeInUp key={p.id} delay={160 + Math.min(idx, 10) * 35}>
                <View style={styles.payrollCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.employeeInfoRow}>
                      <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLetter}>{firstLetter}</Text>
                      </View>
                      <View>
                        <Text style={styles.employeeName}>
                          {p.employeeName ?? 'Staff Member'}
                        </Text>
                        <Text style={styles.payrollDate}>Monthly Net Salary</Text>
                      </View>
                    </View>

                    <Text style={styles.netAmount}>
                      ₹{Number(p.netSalary).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.breakdownBox}>
                    <Text style={styles.breakdownText}>
                      Basic ₹{Number(p.basicSalary).toLocaleString('en-IN')} + Allow ₹{Number(p.allowances).toLocaleString('en-IN')} + Bonus ₹{Number(p.bonus).toLocaleString('en-IN')} - Ded ₹{Number(p.deductions).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: paid ? '#ECFDF5' : '#FFFBEB' },
                      ]}
                    >
                      {!paid && (
                        <View style={{ marginRight: 5 }}>
                          <PulsingGlow color="#F59E0B" size={6} glowRadius={12} duration={1400} />
                        </View>
                      )}
                      <Text
                        style={[
                          styles.statusText,
                          { color: paid ? '#10B981' : '#F59E0B' },
                        ]}
                      >
                        {p.paymentStatus}
                      </Text>
                    </View>

                    {!paid && (
                      <SpringTouch
                        onPress={() => markPaid(p)}
                        activeScale={0.94}
                      >
                        <View style={styles.markPaidBtn}>
                          <Icon name="check" size={16} color="#FFFFFF" />
                          <Text style={styles.markPaidText}>Mark as Paid</Text>
                        </View>
                      </SpringTouch>
                    )}
                  </View>
                </View>
              </FadeInUp>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: AppColors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...AppShadows.glow,
  },
  calcBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* CONTENT */
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  monthBadgeRow: {
    marginBottom: 12,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEECFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },

  /* STATS ROW */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textMuted,
  },

  /* PAYROLL CARD */
  payrollCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  employeeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEECFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.primary,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
  },
  payrollDate: {
    fontSize: 11.5,
    fontWeight: '500',
    color: AppColors.textMuted,
    marginTop: 1,
  },
  netAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  breakdownBox: {
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  breakdownText: {
    fontSize: 11.5,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    ...AppShadows.glow,
  },
  markPaidText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  /* EMPTY & CENTER */
  centerFill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },
});