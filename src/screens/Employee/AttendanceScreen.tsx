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
          style={{ marginTop: 29 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { marginTop: 29 }]}>Attendance</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
          <Text style={styles.dateLabel}>Today · {new Date().toLocaleDateString()}</Text>
          {attendance.length === 0 ? (
            <Text style={styles.emptyText}>No attendance marked yet today</Text>
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

      <TouchableOpacity style={styles.fab} onPress={() => setSheetOpen(true)}>
        <Icon name="fingerprint" color="#fff" size={20} />
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
                  <Icon name="person-outline" color={AppColors.textSecondary} size={20} />
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 100 },
  dateLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 30 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10, gap: 10 },
  rowName: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  rowTime: { color: AppColors.textSecondary, fontSize: 12 },
  pill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  employeeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  employeeName: { flex: 1, color: AppColors.textPrimary, fontSize: 14 },
  statusMenu: { position: 'absolute', right: 0, top: 40, backgroundColor: AppColors.background, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, elevation: 4, zIndex: 10 },
  statusMenuItem: { paddingHorizontal: 16, paddingVertical: 10 },
  statusMenuText: { color: AppColors.textPrimary, fontSize: 13 },
});