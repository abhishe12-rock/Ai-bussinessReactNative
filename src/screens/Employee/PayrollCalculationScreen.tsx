import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';

import { EmployeeService, EmployeeRecord } from '../../services/EmployeeService';
import { AppColors, AppShadows, AppRadius } from '../theme/AppColors';

const service = new EmployeeService();
const { width: SCREEN_WIDTH } = Dimensions.get('window');
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

export default function PayrollCalculationScreen() {
  const navigation = useNavigation<any>();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [calculations, setCalculations] = useState<Record<string, any>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (month: Date) => {
    setLoading(true);
    setError(null);
    setCalculations({});
    try {
      const emps = await service.getEmployees();
      setEmployees(emps);

      const results: Record<string, any> = {};
      for (const e of emps) {
        results[e.id] = await service.calculatePayrollForEmployee({
          employee: e,
          month,
        });
      }
      setCalculations(results);
    } catch (e: any) {
      setError(`Failed to calculate payroll: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(selectedMonth);
  }, [load, selectedMonth]);

  const saveOne = async (e: EmployeeRecord) => {
    const calc = calculations[e.id];
    if (!calc) return;
    setSavingIds((prev) => new Set(prev).add(e.id));
    try {
      await service.savePayrollRecord({
        employeeId: e.id,
        month: selectedMonth,
        basicSalary: calc.earnedBasic,
        allowances: calc.allowances,
        deductions: calc.deductions,
        netSalary: calc.netSalary,
      });
      Alert.alert(`Saved payroll for ${e.fullName}`);
    } catch (err: any) {
      Alert.alert('Failed to save', String(err.message ?? err));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(e.id);
        return next;
      });
    }
  };

  const saveAll = async () => {
    for (const e of employees) await saveOne(e);
    Alert.alert('All payroll records saved');
  };

  const totalNet = Object.values(calculations).reduce(
    (sum, c: any) => sum + c.netSalary,
    0,
  );
  const monthLabel = `${MONTHS[selectedMonth.getMonth() + 1]} ${selectedMonth.getFullYear()}`;

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
          <Text style={styles.headerTitle}>Calculate Payroll</Text>
        </View>

        {employees.length > 0 && (
          <TouchableOpacity
            style={styles.saveAllBtn}
            onPress={saveAll}
            activeOpacity={0.8}
          >
            <Icon name="save" size={18} color="#FFFFFF" />
            <Text style={styles.saveAllBtnText}>Save All</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => load(selectedMonth)}
            tintColor={AppColors.primary}
          />
        }
      >
        {/* MONTH PICKER PILL */}
        <TouchableOpacity
          style={styles.monthPicker}
          onPress={() => setShowPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.monthIconWrap}>
            <Icon name="calendar-today" color={AppColors.primary} size={18} />
          </View>
          <Text style={styles.monthText}>{monthLabel}</Text>
          <Icon name="keyboard-arrow-down" color={AppColors.textSecondary} size={22} />
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedMonth}
            mode="date"
            onChange={(_, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date)
                setSelectedMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
          />
        )}

        {/* HERO TOTAL BANNER */}
        <View style={styles.heroBanner}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <SvgLinearGradient id="payCalcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#5B4DF8" />
                <Stop offset="100%" stopColor="#7C3AED" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#payCalcGrad)" />
          </Svg>

          <View style={styles.bannerDecoCircle1} />
          <View style={styles.bannerDecoCircle2} />

          <View style={styles.bannerInner}>
            <Text style={styles.heroBannerLabel}>
              TOTAL PAYROLL — {monthLabel.toUpperCase()}
            </Text>
            <Text style={styles.heroBannerValue}>
              ₹{totalNet.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.heroBannerSub}>
              Calculated across {employees.length} employees
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Employee Calculations</Text>
          <Text style={styles.resultsCount}>{employees.length} staff</Text>
        </View>

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.emptySubtitle}>Calculating salaries...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Text style={{ color: AppColors.danger, fontSize: 13 }}>{error}</Text>
          </View>
        ) : employees.length === 0 ? (
          <View style={styles.centerFill}>
            <View style={styles.emptyIconCircle}>
              <Icon name="people" size={32} color={AppColors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No employees found</Text>
            <Text style={styles.emptySubtitle}>
              Add employees first to run payroll calculations.
            </Text>
          </View>
        ) : (
          employees.map((e) => {
            const calc = calculations[e.id];
            if (!calc) return null;
            const saving = savingIds.has(e.id);
            const firstLetter = (e.fullName || 'E').charAt(0).toUpperCase();

            return (
              <View key={e.id} style={styles.empCard}>
                <View style={styles.empTopRow}>
                  <View style={styles.empInfoCol}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarLetter}>{firstLetter}</Text>
                    </View>
                    <View>
                      <Text style={styles.empName}>{e.fullName}</Text>
                      <Text style={styles.empDays}>
                        {calc.presentDays} / {calc.totalDays} days present
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.empNet}>
                    ₹{Number(calc.netSalary).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.breakdownBox}>
                  <Text style={styles.breakdownText}>
                    Earned basic ₹{Number(calc.earnedBasic).toLocaleString('en-IN')} + Allow ₹{Number(calc.allowances).toLocaleString('en-IN')} - Ded ₹{Number(calc.deductions).toLocaleString('en-IN')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.saveEmpBtn, saving && { opacity: 0.6 }]}
                  onPress={() => saveOne(e)}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Icon name="check-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.saveEmpBtnText}>Save Record</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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
  saveAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    ...AppShadows.glow,
  },
  saveAllBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* CONTENT */
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  /* MONTH PICKER */
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 16,
    ...AppShadows.subtle,
  },
  monthIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEECFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  monthText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },

  /* HERO TOTAL BANNER */
  heroBanner: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    padding: 20,
    marginBottom: 18,
    backgroundColor: '#5B4DF8',
    ...AppShadows.glow,
  },
  bannerDecoCircle1: {
    position: 'absolute',
    right: -25,
    top: -35,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bannerDecoCircle2: {
    position: 'absolute',
    right: 50,
    bottom: -25,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  bannerInner: {
    position: 'relative',
    zIndex: 2,
  },
  heroBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  heroBannerValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  heroBannerSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
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

  /* EMPLOYEE CARD */
  empCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.card,
  },
  empTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  empInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
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
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
  },
  empDays: {
    fontSize: 11.5,
    fontWeight: '500',
    color: AppColors.textMuted,
    marginTop: 1,
  },
  empNet: {
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
  saveEmpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    height: 40,
    borderRadius: 12,
    ...AppShadows.glow,
  },
  saveEmpBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
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