import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useRoute } from '@react-navigation/native';

import { EmployeeService, LeaveRequestRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();

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

export default function RequestLeaveScreen() {
  const route = useRoute<any>();
  const employeeId: string = route.params?.employeeId;

  const [leaveTypes, setLeaveTypes] = useState<{ id: string; name: string }[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequestRecord[]>([]);
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [types, mine] = await Promise.all([service.getLeaveTypes(), service.getMyLeaveRequests(employeeId)]);
      setLeaveTypes(types); setMyRequests(mine);
    } catch (e: any) {
      setError(`Failed to load: ${e.message ?? e}`);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!selectedLeaveTypeId) return Alert.alert('Please select a leave type');
    if (!startDate || !endDate) return Alert.alert('Please select start and end dates');

    setSubmitting(true);
    try {
      await service.createLeaveRequest({
        employeeId, leaveTypeId: selectedLeaveTypeId, startDate, endDate,
        reason: reason.trim() || undefined,
      });
      Alert.alert('Leave request submitted');
      setSelectedLeaveTypeId(null); setStartDate(null); setEndDate(null); setReason('');
      load();
    } catch (e: any) {
      Alert.alert('Failed to submit', String(e.message ?? e));
    } finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;

  return (
    <View style={styles.flex}>
      <View style={styles.header}><Text style={styles.headerTitle}>My leave</Text></View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Text style={styles.sectionLabel}>Request leave</Text>
        <View style={styles.formCard}>
          <View style={styles.pickerBox}>
            <Picker selectedValue={selectedLeaveTypeId ?? ''} onValueChange={(v) => setSelectedLeaveTypeId(v === '' ? null : String(v))}>
              <Picker.Item label={leaveTypes.length === 0 ? 'No leave types set up' : 'Leave type'} value="" />
              {leaveTypes.map((t) => <Picker.Item key={t.id} label={t.name} value={t.id} />)}
            </Picker>
          </View>

          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowStartPicker(true)}>
              <Icon name="calendar-today" color={AppColors.textMuted} size={16} />
              <Text style={styles.dateText} numberOfLines={1}>{startDate ? startDate.toLocaleDateString() : 'Start date'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndPicker(true)}>
              <Icon name="calendar-today" color={AppColors.textMuted} size={16} />
              <Text style={styles.dateText} numberOfLines={1}>{endDate ? endDate.toLocaleDateString() : 'End date'}</Text>
            </TouchableOpacity>
          </View>
          {showStartPicker && (
            <DateTimePicker
              value={startDate ?? new Date()} mode="date" minimumDate={new Date()}
              onChange={(_, date) => {
                setShowStartPicker(Platform.OS === 'ios');
                if (date) {
                  setStartDate(date);
                  if (endDate && endDate < date) setEndDate(null);
                }
              }}
            />
          )}
          {showEndPicker && (
            <DateTimePicker
              value={endDate ?? startDate ?? new Date()} mode="date" minimumDate={startDate ?? new Date()}
              onChange={(_, date) => { setShowEndPicker(Platform.OS === 'ios'); if (date) setEndDate(date); }}
            />
          )}

          <View style={styles.reasonBox}>
            <TextInput
              style={styles.reasonInput} multiline numberOfLines={2}
              placeholder="Reason (optional)" placeholderTextColor={AppColors.textMuted}
              value={reason} onChangeText={setReason}
            />
          </View>

          <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit request</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>My requests</Text>
        {myRequests.length === 0 ? (
          <Text style={styles.emptyText}>No leave requests yet</Text>
        ) : myRequests.map((r) => {
          const days = Math.round((r.endDate.getTime() - r.startDate.getTime()) / 86400000) + 1;
          return (
            <View key={r.id} style={styles.requestCard}>
              <View style={styles.requestTopRow}>
                <Text style={styles.requestType}>{r.leaveTypeName ?? 'Leave'}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusBg(r.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(r.status) }]}>{r.status}</Text>
                </View>
              </View>
              <Text style={styles.requestMeta}>{days} day(s) · {r.startDate.toLocaleDateString()} → {r.endDate.toLocaleDateString()}</Text>
              {r.reason ? <Text style={styles.requestReason}>{r.reason}</Text> : null}
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
  header: { padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  formCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14, marginBottom: 24 },
  pickerBox: { backgroundColor: AppColors.background, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border },
  dateRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dateBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: AppColors.background, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  dateText: { flex: 1, color: AppColors.textPrimary, fontSize: 13 },
  reasonBox: { backgroundColor: AppColors.background, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12, marginTop: 12 },
  reasonInput: { color: AppColors.textPrimary, fontSize: 14, minHeight: 50, textAlignVertical: 'top' },
  submitButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  submitButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  requestCard: { backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10 },
  requestTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestType: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  requestMeta: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 4 },
  requestReason: { color: AppColors.textSecondary, fontSize: 12, marginTop: 4 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
});