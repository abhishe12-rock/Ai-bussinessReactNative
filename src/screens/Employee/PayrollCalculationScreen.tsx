import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, EmployeeRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PayrollCalculationScreen() {
  const navigation = useNavigation<any>();
  const [selectedMonth, setSelectedMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [calculations, setCalculations] = useState<Record<string, any>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (month: Date) => {
    setLoading(true); setError(null); setCalculations({});
    try {
      const emps = await service.getEmployees();
      setEmployees(emps);

      const results: Record<string, any> = {};
      for (const e of emps) {
        results[e.id] = await service.calculatePayrollForEmployee({ employee: e, month });
      }
      setCalculations(results);
    } catch (e: any) {
      setError(`Failed to calculate payroll: ${e.message ?? e}`);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(selectedMonth); }, [load, selectedMonth]);

  const saveOne = async (e: EmployeeRecord) => {
    const calc = calculations[e.id];
    if (!calc) return;
    setSavingIds((prev) => new Set(prev).add(e.id));
    try {
      await service.savePayrollRecord({
        employeeId: e.id, month: selectedMonth,
        basicSalary: calc.earnedBasic, allowances: calc.allowances,
        deductions: calc.deductions, netSalary: calc.netSalary,
      });
      Alert.alert(`Saved payroll for ${e.fullName}`);
    } catch (err: any) {
      Alert.alert('Failed to save', String(err.message ?? err));
    } finally {
      setSavingIds((prev) => { const next = new Set(prev); next.delete(e.id); return next; });
    }
  };

  const saveAll = async () => {
    for (const e of employees) await saveOne(e);
    Alert.alert('All payroll records saved');
  };

  const totalNet = Object.values(calculations).reduce((sum, c: any) => sum + c.netSalary, 0);
  const monthLabel = `${MONTHS[selectedMonth.getMonth() + 1]} ${selectedMonth.getFullYear()}`;

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calculate payroll</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(selectedMonth)} />}>
        <TouchableOpacity style={styles.monthPicker} onPress={() => setShowPicker(true)}>
          <Icon name="calendar-today" color={AppColors.textMuted} size={18} />
          <Text style={styles.monthText}>{monthLabel}</Text>
          <Icon name="keyboard-arrow-down" color={AppColors.textMuted} size={20} />
        </TouchableOpacity>
        {showPicker && (
          <DateTimePicker
            value={selectedMonth} mode="date"
            onChange={(_, date) => { setShowPicker(Platform.OS === 'ios'); if (date) setSelectedMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}
          />
        )}

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total payroll — {monthLabel}</Text>
          <Text style={styles.totalValue}>₹{totalNet.toFixed(0)}</Text>
        </View>

        {employees.length === 0 ? (
          <Text style={styles.emptyText}>No employees yet</Text>
        ) : employees.map((e) => {
          const calc = calculations[e.id];
          if (!calc) return null;
          const saving = savingIds.has(e.id);
          return (
            <View key={e.id} style={styles.empCard}>
              <View style={styles.empTopRow}>
                <Text style={styles.empName}>{e.fullName}</Text>
                <Text style={styles.empNet}>₹{calc.netSalary.toFixed(0)}</Text>
              </View>
              <Text style={styles.empDays}>{calc.presentDays} / {calc.totalDays} days present</Text>
              <Text style={styles.empBreakdown}>
                Earned basic ₹{calc.earnedBasic.toFixed(0)} + Allow ₹{calc.allowances.toFixed(0)} - Ded ₹{calc.deductions.toFixed(0)}
              </Text>
              <TouchableOpacity style={styles.saveEmpButton} onPress={() => saveOne(e)} disabled={saving}>
                {saving ? <ActivityIndicator color={AppColors.primary} size="small" /> : <Text style={styles.saveEmpText}>Save this employee</Text>}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {employees.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={saveAll}>
          <Icon name="save" color="#fff" size={20} />
          <Text style={styles.fabText}>Save all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 100 },
  monthPicker: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  monthText: { flex: 1, color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' },
  totalCard: { backgroundColor: AppColors.primarySoft, borderRadius: 14, padding: 13, marginTop: 14 },
  totalLabel: { color: AppColors.primary, fontSize: 11 },
  totalValue: { color: AppColors.primary, fontSize: 20, fontWeight: '800', marginTop: 5 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30 },
  empCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14, marginTop: 20 },
  empTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empName: { flex: 1, color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  empNet: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '800' },
  empDays: { color: AppColors.textSecondary, fontSize: 12, marginTop: 4 },
  empBreakdown: { color: AppColors.textMuted, fontSize: 11, marginTop: 8 },
  saveEmpButton: { borderWidth: 1, borderColor: AppColors.primary, borderRadius: 10, height: 36, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveEmpText: { color: AppColors.primary, fontSize: 12.5, fontWeight: '600' },
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});