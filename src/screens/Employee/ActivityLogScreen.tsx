import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, ActivityLogRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();

function moduleIcon(module: string) {
  switch (module.toLowerCase()) {
    case 'sales': return 'point-of-sale';
    case 'orders': return 'shopping-bag';
    case 'inventory': return 'inventory-2';
    case 'purchase': return 'local-shipping';
    case 'customers': return 'people-outline';
    case 'employees': return 'badge';
    default: return 'radio-button-unchecked';
  }
}

export default function ActivityLogScreen() {
  const navigation = useNavigation<any>();
  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [moduleFilter, setModuleFilter] = useState('All');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setLogs(await service.getActivityLogs()); }
    catch (e: any) { setError(`Failed to load activity: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const employeeNames = useMemo(() => Array.from(new Set(logs.map((l) => l.employeeName ?? 'System'))).sort(), [logs]);
  const moduleNames = useMemo(() => Array.from(new Set(logs.map((l) => l.module).filter(Boolean))).sort(), [logs]);

  const filtered = useMemo(() => logs.filter((l) =>
    (employeeFilter === 'All' || (l.employeeName ?? 'System') === employeeFilter) &&
    (moduleFilter === 'All' || l.module === moduleFilter)
  ), [logs, employeeFilter, moduleFilter]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity Audit Log</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterBox}>
          <Picker selectedValue={employeeFilter} onValueChange={setEmployeeFilter}>
            <Picker.Item label="All Employees" value="All" />
            {employeeNames.map((n) => <Picker.Item key={n} label={n} value={n} />)}
          </Picker>
        </View>
        <View style={styles.filterBox}>
          <Picker selectedValue={moduleFilter} onValueChange={setModuleFilter}>
            <Picker.Item label="All Modules" value="All" />
            {moduleNames.map((m) => <Picker.Item key={m} label={m} value={m} />)}
          </Picker>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5, fontWeight: '500' }}>{error}</Text></View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No activity records match this filter</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
          {filtered.map((log) => (
            <View key={log.id} style={styles.card}>
              <View style={styles.cardIcon}><Icon name={moduleIcon(log.module)} color={AppColors.primary} size={16} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  <Text style={styles.cardName}>{log.employeeName ?? 'System'}</Text>
                  <Text style={styles.cardMeta}>  {log.module} · {log.action.replace('_', ' ')}</Text>
                </Text>
                {log.description ? <Text style={styles.cardDesc}>{log.description}</Text> : null}
                <Text style={styles.cardTime}>
                  {log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.createdAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
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
  filterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  filterBox: { flex: 1, backgroundColor: AppColors.surface, borderRadius: 10, borderWidth: 1, borderColor: AppColors.border },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  content: { padding: 16, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 13,
    marginBottom: 8,
    gap: 12,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: {},
  cardName: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700' },
  cardMeta: { color: AppColors.textSecondary, fontSize: 12 },
  cardDesc: { color: AppColors.textSecondary, fontSize: 12, marginTop: 3 },
  cardTime: { color: AppColors.textMuted, fontSize: 11, marginTop: 4 },
});