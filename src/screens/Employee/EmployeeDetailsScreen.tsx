import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { EmployeeService, EmployeeRecord, AttendanceRecord, LeaveRequestRecord, ActivityLogRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();
const TABS = ['Overview', 'Attendance', 'Salary', 'Leave', 'Activity'];

export default function EmployeeDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const employee: EmployeeRecord = route.params.employee;
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <View style={{ width: 22 }} />
        <TouchableOpacity onPress={() => navigation.navigate('ManageAccess', { employee })}>
          <Icon name="admin-panel-settings" color={AppColors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => setActiveTab(i)}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
            {activeTab === i && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        {activeTab === 0 && <OverviewTab employee={employee} />}
        {activeTab === 1 && <AttendanceTab employee={employee} />}
        {activeTab === 2 && <SalaryTab employee={employee} />}
        {activeTab === 3 && <LeaveTab employee={employee} />}
        {activeTab === 4 && <ActivityTab employee={employee} />}
      </View>
    </View>
  );
}

function fmtDate(d?: Date | null) {
  return d ? d.toLocaleDateString() : 'Not set';
}

function OverviewTab({ employee }: { employee: EmployeeRecord }) {
  const initials = employee.fullName.trim().split(' ').filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.sectionLabel}>Personal</Text>
      <View style={styles.profileCard}>
        {employee.profilePhotoUrl ? (
          <Image source={{ uri: employee.profilePhotoUrl }} style={styles.profileImg} />
        ) : (
          <View style={styles.profileInitials}><Text style={styles.profileInitialsText}>{initials}</Text></View>
        )}
        <View style={{ marginLeft: 14 }}>
          <Text style={styles.profileName}>{employee.fullName}</Text>
          <Text style={styles.profileCode}>{employee.employeeCode}</Text>
          {employee.profilePhotoUrl ? <Text style={styles.profilePhotoTag}>Profile photo</Text> : null}
        </View>
      </View>

      <View style={styles.infoCard}>
        <InfoRow icon="call" label="Phone" value={employee.phone ?? 'Not set'} />
        <InfoRow icon="mail-outline" label="Email" value={employee.email ?? 'Not set'} />
        <InfoRow icon="cake" label="Date of birth" value={fmtDate(employee.dateOfBirth)} />
        <InfoRow icon="person-outline" label="Gender" value={employee.gender ? employee.gender.replace('_', ' ') : 'Not set'} />
        <InfoRow icon="location-on" label="Address" value={employee.address ?? 'Not set'} isLast />
      </View>

      <Text style={styles.sectionLabel}>Employment</Text>
      <View style={styles.infoCard}>
        <InfoRow icon="apartment" label="Department" value={employee.departmentName ?? 'Not set'} />
        <InfoRow icon="work-outline" label="Designation" value={employee.designation ?? 'Not set'} />
        <InfoRow icon="calendar-today" label="Joining date" value={employee.joiningDate.toLocaleDateString()} />
        <InfoRow icon="badge" label="Employment type" value={employee.employmentType.replace('_', ' ')} isLast />
      </View>
    </ScrollView>
  );
}

function SalaryTab({ employee }: { employee: EmployeeRecord }) {
  const net = employee.basicSalary + employee.allowances - employee.deductions;
  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.infoCard}>
        <InfoRow icon="payments" label="Basic salary" value={`₹${employee.basicSalary.toFixed(0)}`} />
        <InfoRow icon="add-circle-outline" label="Allowances" value={`₹${employee.allowances.toFixed(0)}`} />
        <InfoRow icon="remove-circle-outline" label="Deductions" value={`- ₹${employee.deductions.toFixed(0)}`} />
        <View style={styles.divider} />
        <InfoRow icon="account-balance-wallet" label="Net salary" value={`₹${net.toFixed(0)}`} isLast bold />
      </View>
      <View style={styles.noticeBox}>
        <Icon name="info-outline" color={AppColors.info} size={18} />
        <Text style={styles.noticeText}>Actual monthly payroll (calculated from attendance) is in the Payroll screen.</Text>
      </View>
    </ScrollView>
  );
}

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

function AttendanceTab({ employee }: { employee: EmployeeRecord }) {
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (m: Date) => {
    setLoading(true);
    setError(null);
    try {
      setRecords(await service.getMyAttendanceForMonth(employee.id, m));
    } catch (e: any) {
      setError(`Failed to load attendance: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(month); }, [month]);

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;

  const byDay: Record<number, AttendanceRecord> = {};
  records.forEach((r) => { byDay[r.date.getDate()] = r; });
  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();
  const presentDays = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const monthLabel = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const cells = Array.from({ length: leadingBlanks + daysInMonth }, (_, i) => i);

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <Icon name="chevron-left" color={AppColors.textSecondary} size={22} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <Icon name="chevron-right" color={AppColors.textSecondary} size={22} />
        </TouchableOpacity>
      </View>

      <View style={styles.presentBanner}>
        <Text style={styles.presentBannerText}>{presentDays} days present this month</Text>
      </View>

      <View style={styles.calendarGrid}>
        {cells.map((i) => {
          if (i < leadingBlanks) return <View key={i} style={styles.calendarCell} />;
          const day = i - leadingBlanks + 1;
          const record = byDay[day];
          return (
            <View key={i} style={[styles.calendarCell, { backgroundColor: record ? statusBg(record.status) : AppColors.surface }]}>
              <Text style={[styles.calendarDay, { color: record ? statusColor(record.status) : AppColors.textMuted }]}>{day}</Text>
              {record && <Icon name={record.status === 'PRESENT' || record.status === 'LATE' ? 'check-circle' : 'cancel'} size={12} color={statusColor(record.status)} />}
            </View>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Details</Text>
      {records.length === 0 ? (
        <Text style={styles.emptyText}>No attendance recorded this month</Text>
      ) : records.map((a) => (
        <View key={a.id} style={styles.attendanceRow}>
          <Text style={styles.attendanceDate}>{a.date.toLocaleDateString()}</Text>
          {a.checkIn && <Text style={styles.attendanceTime}>{a.checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {a.checkOut ? a.checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text>}
          <View style={[styles.statusPill, { backgroundColor: statusBg(a.status) }]}>
            <Text style={[styles.statusText, { color: statusColor(a.status) }]}>{a.status}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function LeaveTab({ employee }: { employee: EmployeeRecord }) {
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setRequests(await service.getMyLeaveRequests(employee.id)); }
    catch (e: any) { setError(`Failed to load leave: ${e.message ?? e}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (r: LeaveRequestRecord, status: string) => {
    try { await service.updateLeaveStatus(r.id, status); load(); }
    catch (e: any) { Alert.alert('Failed', String(e.message ?? e)); }
  };

  function leaveColor(status: string) {
    switch (status) {
      case 'APPROVED': return AppColors.success;
      case 'REJECTED': return AppColors.danger;
      case 'CANCELLED': return AppColors.textMuted;
      default: return AppColors.warning;
    }
  }
  function leaveBg(status: string) {
    switch (status) {
      case 'APPROVED': return AppColors.successSoft;
      case 'REJECTED': return AppColors.dangerSoft;
      case 'CANCELLED': return AppColors.surfaceSoft;
      default: return AppColors.warningSoft;
    }
  }

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;
  if (requests.length === 0) return <View style={styles.centerFill}><Text style={styles.emptyText}>No leave requests</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {requests.map((r) => {
        const days = Math.round((r.endDate.getTime() - r.startDate.getTime()) / 86400000) + 1;
        return (
          <View key={r.id} style={styles.leaveCard}>
            <View style={styles.leaveTopRow}>
              <Text style={styles.leaveType}>{r.leaveTypeName ?? 'Leave'}</Text>
              <View style={[styles.statusPill, { backgroundColor: leaveBg(r.status) }]}>
                <Text style={[styles.statusText, { color: leaveColor(r.status) }]}>{r.status}</Text>
              </View>
            </View>
            <Text style={styles.leaveDays}>{days} day(s)</Text>
            <Text style={styles.leaveDates}>{r.startDate.toLocaleDateString()} → {r.endDate.toLocaleDateString()}</Text>
            {r.reason ? <Text style={styles.leaveReason}>Reason: {r.reason}</Text> : null}
            {r.status === 'PENDING' && (
              <View style={styles.leaveActions}>
                <TouchableOpacity style={styles.rejectButton} onPress={() => updateStatus(r, 'REJECTED')}>
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveButton} onPress={() => updateStatus(r, 'APPROVED')}>
                  <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function moduleIcon(module: string) {
  switch (module.toLowerCase()) {
    case 'sales': return 'point-of-sale';
    case 'orders': return 'shopping-bag';
    case 'inventory': return 'inventory-2';
    case 'purchase': return 'local-shipping';
    case 'customers': return 'people-outline';
    default: return 'notes';
  }
}

function ActivityTab({ employee }: { employee: EmployeeRecord }) {
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try { setLogs(await service.getMyActivities(employee.id)); }
      catch (e: any) { setError(`Failed to load activity: ${e.message ?? e}`); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;
  if (logs.length === 0) return <View style={styles.centerFill}><Text style={styles.emptyText}>No activity recorded yet</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {logs.map((log) => (
        <View key={log.id} style={styles.activityCard}>
          <View style={styles.activityIcon}><Icon name={moduleIcon(log.module)} color={AppColors.primary} size={16} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.activityModule}>{log.module}</Text>
            {log.description ? <Text style={styles.activityDesc}>{log.description}</Text> : null}
            <Text style={styles.activityTime}>{log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.createdAt.toLocaleDateString()}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, isLast, bold }: { icon: any; label: string; value: string; isLast?: boolean; bold?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Icon name={icon} color={AppColors.textMuted} size={18} />
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.infoValue, bold && { color: AppColors.primary, fontSize: 15 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: AppColors.surface },
  tabBar: { backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border, flexGrow: 0 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '500' },
  tabTextActive: { color: AppColors.primary, fontWeight: '600' },
  tabIndicator: { height: 2, backgroundColor: AppColors.primary, marginTop: 8, borderRadius: 1 },
  tabContent: { padding: 16, paddingBottom: 24 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 16, marginBottom: 12 },
  profileImg: { width: 72, height: 72, borderRadius: 36 },
  profileInitials: { width: 72, height: 72, borderRadius: 36, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  profileInitialsText: { color: AppColors.primary, fontSize: 18, fontWeight: '700' },
  profileName: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700' },
  profileCode: { color: AppColors.textSecondary, fontSize: 12, marginTop: 4 },
  profilePhotoTag: { color: AppColors.success, fontSize: 11, fontWeight: '600', marginTop: 5 },
  infoCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  infoLabel: { color: AppColors.textSecondary, fontSize: 13 },
  infoValue: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 8, marginHorizontal: 14 },
  noticeBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: AppColors.infoSoft, borderRadius: 12, padding: 12, marginTop: 16 },
  noticeText: { flex: 1, color: AppColors.info, fontSize: 12, fontWeight: '500' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  presentBanner: { backgroundColor: AppColors.successSoft, borderRadius: 12, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  presentBannerText: { color: AppColors.success, fontSize: 13, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 16 },
  calendarCell: { width: '13%', aspectRatio: 1, borderRadius: 10, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center', justifyContent: 'center' },
  calendarDay: { fontSize: 12, fontWeight: '700' },
  attendanceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12, marginBottom: 8, gap: 8 },
  attendanceDate: { flex: 1, color: AppColors.textPrimary, fontSize: 13 },
  attendanceTime: { color: AppColors.textSecondary, fontSize: 11.5 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  leaveCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14, marginBottom: 12 },
  leaveTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveType: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  leaveDays: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6 },
  leaveDates: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 3 },
  leaveReason: { color: AppColors.textSecondary, fontSize: 12, marginTop: 6 },
  leaveActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  rejectButton: { flex: 1, borderWidth: 1, borderColor: AppColors.danger, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  rejectButtonText: { color: AppColors.danger, fontSize: 12.5, fontWeight: '600' },
  approveButton: { flex: 1, backgroundColor: AppColors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveButtonText: { color: '#fff', fontSize: 12.5, fontWeight: '600' },
  activityCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10, gap: 12 },
  activityIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  activityModule: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700' },
  activityDesc: { color: AppColors.textSecondary, fontSize: 12, marginTop: 3 },
  activityTime: { color: AppColors.textMuted, fontSize: 11, marginTop: 4 },
});