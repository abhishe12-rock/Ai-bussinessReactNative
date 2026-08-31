import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, PayrollRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollScreen() {
  const navigation = useNavigation<any>();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setPayroll(await service.getPayroll(new Date())); }
    catch (e: any) { setError(`Failed to load payroll: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markPaid = async (p: PayrollRecord) => {
    try { await service.markPayrollPaid(p.id); load(); }
    catch (e: any) { Alert.alert('Failed', String(e.message ?? e)); }
  };

  const now = new Date();
  const monthLabel = `${MONTHS[now.getMonth() + 1]} ${now.getFullYear()}`;
  const totalNet = payroll.reduce((sum, p) => sum + p.netSalary, 0);
  const pendingCount = payroll.filter((p) => p.paymentStatus === 'PENDING').length;

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Salary / Payroll</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: AppColors.primarySoft }]}>
            <Text style={[styles.statLabel, { color: AppColors.primary }]}>Total payroll</Text>
            <Text style={[styles.statValue, { color: AppColors.primary }]}>₹{totalNet.toFixed(0)}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: AppColors.warningSoft }]}>
            <Text style={[styles.statLabel, { color: AppColors.warning }]}>Pending payments</Text>
            <Text style={[styles.statValue, { color: AppColors.warning }]}>{pendingCount}</Text>
          </View>
        </View>

        {payroll.length === 0 ? (
          <Text style={styles.emptyText}>No payroll records for this month yet</Text>
        ) : payroll.map((p) => {
          const paid = p.paymentStatus === 'PAID';
          return (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardName}>{p.employeeName ?? 'Unknown'}</Text>
                <Text style={styles.cardNet}>₹{p.netSalary.toFixed(0)}</Text>
              </View>
              <Text style={styles.cardBreakdown}>
                Basic ₹{p.basicSalary.toFixed(0)} + Allow ₹{p.allowances.toFixed(0)} + Bonus ₹{p.bonus.toFixed(0)} - Ded ₹{p.deductions.toFixed(0)}
              </Text>
              <View style={styles.cardBottomRow}>
                <View style={[styles.statusPill, { backgroundColor: paid ? AppColors.successSoft : AppColors.warningSoft }]}>
                  <Text style={[styles.statusText, { color: paid ? AppColors.success : AppColors.warning }]}>{p.paymentStatus}</Text>
                </View>
                {!paid && (
                  <TouchableOpacity style={styles.markPaidButton} onPress={() => markPaid(p)}>
                    <Text style={styles.markPaidText}>Mark as paid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  monthLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 13 },
  statLabel: { fontSize: 11 },
  statValue: { fontSize: 17, fontWeight: '800', marginTop: 5 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginTop: 20 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  cardNet: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  cardBreakdown: { color: AppColors.textSecondary, fontSize: 11, marginTop: 4 },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  markPaidButton: { backgroundColor: AppColors.primarySoft, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  markPaidText: { color: AppColors.primary, fontSize: 11.5, fontWeight: '700' },
});