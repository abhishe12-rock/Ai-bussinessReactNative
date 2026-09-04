import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, EmployeeRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';
import { FadeInUp, SpringTouch, PulsingGlow } from '../theme/Animations';

const service = new EmployeeService();

function statusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return AppColors.success;
    case 'ON_LEAVE': return AppColors.warning;
    case 'SUSPENDED': return AppColors.danger;
    default: return AppColors.textMuted;
  }
}
function statusBg(status: string) {
  switch (status) {
    case 'ACTIVE': return AppColors.successSoft;
    case 'ON_LEAVE': return AppColors.warningSoft;
    case 'SUSPENDED': return AppColors.dangerSoft;
    default: return AppColors.surfaceSoft;
  }
}

export default function EmployeeListScreen() {
  const navigation = useNavigation<any>();
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEmployees(await service.getEmployees());
    } catch (e: any) {
      setError(`Failed to load employees: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => employees.filter((e) =>
      e.fullName.toLowerCase().includes(query.toLowerCase()) ||
      e.employeeCode.toLowerCase().includes(query.toLowerCase())),
    [employees, query],
  );

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Employees</Text>
            <Text style={styles.headerSubtitle}>Workforce directory & access</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Attendance')}>
            <Icon name="fingerprint" color={AppColors.textSecondary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('Leave')}>
            <Icon name="event-available" color={AppColors.textSecondary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.navigate('ActivityLog')}>
            <Icon name="history" color={AppColors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={18} />
          <TextInput style={styles.searchInput} placeholder="Search name or employee ID" placeholderTextColor={AppColors.textMuted} value={query} onChangeText={setQuery} />
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No employees found</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item, index }) => {
            const initials = item.fullName.trim().split(' ').map((s) => s[0] ?? '').slice(0, 2).join('').toUpperCase();
            const isActive = item.status === 'ACTIVE';
            return (
              <FadeInUp delay={Math.min(index, 10) * 35}>
                <SpringTouch
                  activeScale={0.97}
                  onPress={() => { navigation.navigate('EmployeeDetails', { employee: item }); }}
                >
                  <View style={styles.card}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardName}>{item.fullName}</Text>
                      <Text style={styles.cardSub}>{item.employeeCode} · {item.designation ?? 'Team Member'}</Text>
                      {item.departmentName ? <Text style={styles.cardMuted}>{item.departmentName}</Text> : null}
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: statusBg(item.status), flexDirection: 'row', alignItems: 'center' }]}>
                      {isActive && (
                        <View style={{ marginRight: 5 }}>
                          <PulsingGlow color={AppColors.success} size={5} glowRadius={10} duration={1600} />
                        </View>
                      )}
                      <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text>
                    </View>
                  </View>
                </SpringTouch>
              </FadeInUp>
            );
          }}
        />
      )}

      <SpringTouch
        style={styles.fab}
        onPress={() => navigation.navigate('AddEmployee', { onSaved: load })}
        activeScale={0.93}
      >
        <Icon name="person-add-alt-1" color="#fff" size={18} />
        <Text style={styles.fabText}>Add employee</Text>
      </SpringTouch>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 1,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.surfaceSoft,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, paddingVertical: 11, marginLeft: 8, color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.danger, fontSize: 12.5, textAlign: 'center', marginTop: 10, fontWeight: '500' },
  retryText: { color: AppColors.primary, marginTop: 10, fontWeight: '700' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13.5 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: AppColors.border,
    padding: 14,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: AppColors.primarySoft,
    borderWidth: 1,
    borderColor: `${AppColors.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: AppColors.primary, fontWeight: '800', fontSize: 14 },
  cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  cardSub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2, fontWeight: '500' },
  cardMuted: { color: AppColors.textMuted, fontSize: 11.5, marginTop: 1 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 7,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});