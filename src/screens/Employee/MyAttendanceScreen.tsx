import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import { useRoute } from '@react-navigation/native';

import { EmployeeService, AttendanceRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();
const biometrics = new ReactNativeBiometrics();

function statusColor(status: string) {
  switch (status) {
    case 'PRESENT': return AppColors.success;
    case 'LATE': return AppColors.warning;
    case 'LEAVE': return AppColors.info;
    default: return AppColors.danger;
  }
}
function statusBg(status: string) {
  switch (status) {
    case 'PRESENT': return AppColors.successSoft;
    case 'LATE': return AppColors.warningSoft;
    case 'LEAVE': return AppColors.infoSoft;
    default: return AppColors.dangerSoft;
  }
}
function fmtTime(t?: Date | null) {
  return t ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
}

export default function MyAttendanceScreen() {
  const route = useRoute<any>();
  const employeeId: string = route.params?.employeeId;

  const [today, setToday] = useState<AttendanceRecord | null>(null);
  const [monthHistory, setMonthHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [t, m] = await Promise.all([
        service.getMyTodayAttendance(employeeId),
        service.getMyAttendanceForMonth(employeeId, new Date()),
      ]);
      setToday(t); setMonthHistory(m);
    } catch (e: any) {
      setError(`Failed to load attendance: ${e.message ?? e}`);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const verifyIdentity = async (reason: string): Promise<boolean> => {
    try {
      const { available } = await biometrics.isSensorAvailable();
      if (!available) return true; // no biometric hardware — allow through
      const { success } = await biometrics.simplePrompt({ promptMessage: reason });
      return success;
    } catch (e: any) {
      Alert.alert('Verification failed', String(e.message ?? e));
      return false;
    }
  };

  const checkIn = async () => {
    setBusy(true);
    try {
      const verified = await verifyIdentity("Verify it's you to check in");
      if (!verified) return;
      await service.checkInSelf(employeeId);
      Alert.alert('Checked in successfully');
      await load();
    } catch (e: any) {
      Alert.alert('Check-in failed', String(e.message ?? e));
    } finally { setBusy(false); }
  };

  const checkOut = async () => {
    setBusy(true);
    try {
      const verified = await verifyIdentity("Verify it's you to check out");
      if (!verified) return;
      await service.checkOutSelf(employeeId);
      Alert.alert('Checked out successfully');
      await load();
    } catch (e: any) {
      Alert.alert('Check-out failed', String(e.message ?? e));
    } finally { setBusy(false); }
  };

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;

  const presentDays = monthHistory.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const hasCheckedIn = !!today?.checkIn;
  const hasCheckedOut = !!today?.checkOut;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Attendance</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <View style={styles.statusCard}>
          <Text style={styles.dateLabel}>Today · {new Date().toLocaleDateString()}</Text>
          {today ? (
            <View style={[styles.statusPill, { backgroundColor: statusBg(today.status) }]}>
              <Text style={[styles.statusPillText, { color: statusColor(today.status) }]}>{today.status}</Text>
            </View>
          ) : (
            <Text style={styles.notCheckedIn}>Not checked in yet</Text>
          )}

          <View style={styles.timeRow}>
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>Check in</Text>
              <Text style={styles.timeValue}>{fmtTime(today?.checkIn)}</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeCol}>
              <Text style={styles.timeLabel}>Check out</Text>
              <Text style={styles.timeValue}>{fmtTime(today?.checkOut)}</Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, hasCheckedIn ? styles.actionButtonDisabled : styles.actionButtonPrimary]}
              disabled={busy || hasCheckedIn} onPress={checkIn}
            >
              <Text style={[styles.actionButtonText, hasCheckedIn && { color: AppColors.textMuted }]}>Check in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, (!hasCheckedIn || hasCheckedOut) ? styles.actionButtonDisabled : styles.actionButtonDark]}
              disabled={busy || !hasCheckedIn || hasCheckedOut} onPress={checkOut}
            >
              <Text style={[styles.actionButtonText, (!hasCheckedIn || hasCheckedOut) && { color: AppColors.textMuted }]}>Check out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.presentCard}>
          <Text style={styles.presentLabel}>Present this month</Text>
          <Text style={styles.presentValue}>{presentDays} days</Text>
        </View>

        <Text style={styles.sectionLabel}>This month</Text>
        {monthHistory.length === 0 ? (
          <Text style={styles.emptyText}>No attendance recorded yet</Text>
        ) : monthHistory.map((a) => (
          <View key={a.id} style={styles.historyRow}>
            <Text style={styles.historyDate}>{a.date.toLocaleDateString()}</Text>
            <Text style={styles.historyTime}>{fmtTime(a.checkIn)} - {fmtTime(a.checkOut)}</Text>
            <View style={[styles.statusPill, { backgroundColor: statusBg(a.status) }]}>
              <Text style={[styles.statusPillText, { color: statusColor(a.status) }]}>{a.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  content: { padding: 16, paddingBottom: 32 },
  statusCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 20,
    alignItems: 'center',
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  dateLabel: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600', letterSpacing: 0.2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 12 },
  statusPillText: { fontSize: 10.5, fontWeight: '700' },
  notCheckedIn: { color: AppColors.textMuted, fontSize: 13, marginTop: 12 },
  timeRow: { flexDirection: 'row', width: '100%', marginTop: 16 },
  timeCol: { flex: 1, alignItems: 'center' },
  timeLabel: { color: AppColors.textMuted, fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  timeValue: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 4, letterSpacing: -0.5 },
  timeDivider: { width: 1, height: 36, backgroundColor: AppColors.border, alignSelf: 'center' },
  buttonRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 18 },
  actionButton: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  actionButtonPrimary: { backgroundColor: AppColors.primary },
  actionButtonDark: { backgroundColor: AppColors.textPrimary },
  actionButtonDisabled: { backgroundColor: AppColors.surfaceSoft },
  actionButtonText: { color: '#fff', fontSize: 13.5, fontWeight: '600' },
  presentCard: {
    backgroundColor: AppColors.successSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${AppColors.success}30`,
    padding: 14,
    marginTop: 16,
  },
  presentLabel: { color: AppColors.success, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  presentValue: { color: AppColors.success, fontSize: 22, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 24, marginBottom: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 13,
    marginBottom: 8,
    gap: 10,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  historyDate: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  historyTime: { color: AppColors.textSecondary, fontSize: 12 },
});