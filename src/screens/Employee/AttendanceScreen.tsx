import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Modal, Pressable, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, AttendanceRecord, EmployeeRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();

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

export default function AttendanceScreen() {
  const navigation = useNavigation<any>();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState<EmployeeRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [att, emps] = await Promise.all([service.getAttendance(new Date()), service.getEmployees()]);
      setAttendance(att); setEmployees(emps);
    } catch (e: any) {
      setError(`Failed to load attendance: ${e.message ?? e}`);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markStatus = async (employeeId: string, status: string) => {
    setPickerFor(null);
    try { await service.markAttendance({ employeeId, date: new Date(), status }); load(); }
    catch (e: any) { Alert.alert('Failed', String(e.message ?? e)); }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5, fontWeight: '500' }}>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
          <Text style={styles.dateLabel}>Today · {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          {attendance.length === 0 ? (
            <Text style={styles.emptyText}>No attendance records for today</Text>
          ) : attendance.map((a) => (
            <View key={a.id} style={styles.row}>
              <Text style={styles.rowName}>{a.employeeName ?? 'Unknown'}</Text>
              {a.checkIn && <Text style={styles.rowTime}>{a.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
              <View style={[styles.pill, { backgroundColor: statusBg(a.status) }]}>
                <Text style={[styles.pillText, { color: statusColor(a.status) }]}>{a.status}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setSheetOpen(true)} activeOpacity={0.8}>
        <Icon name="fingerprint" color="#fff" size={18} />
        <Text style={styles.fabText}>Mark attendance</Text>
      </TouchableOpacity>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Mark attendance</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {employees.map((e) => (
                <View key={e.id} style={styles.employeeRow}>
                  <Icon name="person-outline" color={AppColors.textSecondary} size={18} />
                  <Text style={styles.employeeName}>{e.fullName}</Text>
                  <TouchableOpacity onPress={() => setPickerFor(pickerFor?.id === e.id ? null : e)}>
                    <Icon name="more-vert" color={AppColors.textMuted} size={20} />
                  </TouchableOpacity>
                  {pickerFor?.id === e.id && (
                    <View style={styles.statusMenu}>
                      {['PRESENT', 'ABSENT', 'LATE', 'LEAVE'].map((s) => (
                        <TouchableOpacity key={s} style={styles.statusMenuItem} onPress={() => markStatus(e.id, s)}>
                          <Text style={styles.statusMenuText}>{s.charAt(0) + s.slice(1).toLowerCase()}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 150 },
  dateLabel: { color: AppColors.textSecondary, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30 },
  row: {
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  rowName: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  rowTime: { color: AppColors.textSecondary, fontSize: 12 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    gap: 6,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 12 },
  employeeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderColor: AppColors.border },
  employeeName: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '500' },
  statusMenu: { position: 'absolute', right: 0, top: 36, backgroundColor: AppColors.surface, borderRadius: 10, borderWidth: 1, borderColor: AppColors.border, elevation: 4, zIndex: 10, shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  statusMenuItem: { paddingHorizontal: 16, paddingVertical: 9 },
  statusMenuText: { color: AppColors.textPrimary, fontSize: 12.5, fontWeight: '600' },
});