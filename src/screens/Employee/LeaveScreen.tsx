import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, LeaveRequestRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();
const STATUS_OPTIONS = ['All', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

function statusColor(status: string) {
  switch (status) {
    case 'APPROVED': return AppColors.success;
    case 'REJECTED': return AppColors.danger;
    case 'CANCELLED': return AppColors.textMuted;
    default: return AppColors.warning;
  }
}
function statusBg(status: string) {
  switch (status) {
    case 'APPROVED': return AppColors.successSoft;
    case 'REJECTED': return AppColors.dangerSoft;
    case 'CANCELLED': return AppColors.surfaceSoft;
    default: return AppColors.warningSoft;
  }
}

export default function LeaveScreen() {
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRequests(await service.getLeaveRequests()); }
    catch (e: any) { setError(`Failed to load leave requests: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (r: LeaveRequestRecord, status: string) => {
    try { await service.updateLeaveStatus(r.id, status); load(); }
    catch (e: any) { Alert.alert('Failed', String(e.message ?? e)); }
  };

  const employeeNames = useMemo(() => {
    const names = Array.from(new Set(requests.map((r) => r.employeeName ?? 'Unknown')));
    return names.sort();
  }, [requests]);

  const filtered = useMemo(() => requests.filter((r) =>
    (statusFilter === 'All' || r.status === statusFilter) &&
    (employeeFilter === 'All' || (r.employeeName ?? 'Unknown') === employeeFilter)
  ), [requests, statusFilter, employeeFilter]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leave Requests</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          {STATUS_OPTIONS.map((option) => {
            const selected = statusFilter === option;
            return (
              <TouchableOpacity key={option} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setStatusFilter(option)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.employeeFilterBox}>
          <Icon name="person-outline" color={AppColors.textMuted} size={18} />
          <Picker selectedValue={employeeFilter} onValueChange={setEmployeeFilter} style={{ flex: 1 }}>
            <Picker.Item label="All" value="All" />
            {employeeNames.map((n) => <Picker.Item key={n} label={n} value={n} />)}
          </Picker>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5, fontWeight: '500' }}>{error}</Text></View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No leave requests match this filter</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
          {filtered.map((r) => {
            const days = Math.round((r.endDate.getTime() - r.startDate.getTime()) / 86400000) + 1;
            return (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardName}>{r.employeeName ?? 'Unknown'}</Text>
                  <View style={[styles.pill, { backgroundColor: statusBg(r.status) }]}>
                    <Text style={[styles.pillText, { color: statusColor(r.status) }]}>{r.status}</Text>
                  </View>
                </View>
                <Text style={styles.cardSub}>{r.leaveTypeName ?? 'Leave'} · {days} day(s)</Text>
                <Text style={styles.cardMuted}>{r.startDate.toLocaleDateString()} → {r.endDate.toLocaleDateString()}</Text>
                {r.reason ? <Text style={styles.cardReason}>Reason: {r.reason}</Text> : null}
                {r.status === 'PENDING' && (
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => updateStatus(r, 'REJECTED')} activeOpacity={0.7}>
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.approveButton} onPress={() => updateStatus(r, 'APPROVED')} activeOpacity={0.7}>
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
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
  filterBar: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 10 },
  chip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 8, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border, marginRight: 8 },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { fontSize: 12, color: AppColors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  employeeFilterBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 10, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 10 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  content: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    marginBottom: 10,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  cardSub: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4 },
  cardMuted: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 2 },
  cardReason: { color: AppColors.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 17 },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10.5, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectButton: { flex: 1, borderWidth: 1, borderColor: AppColors.danger, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  rejectText: { color: AppColors.danger, fontSize: 12.5, fontWeight: '600' },
  approveButton: { flex: 1, backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  approveText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
});