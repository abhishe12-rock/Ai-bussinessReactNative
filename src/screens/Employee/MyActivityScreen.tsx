import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useRoute } from '@react-navigation/native';

import { EmployeeService, ActivityLogRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();
const MODULES = ['General', 'Sales', 'Inventory', 'Customers', 'Orders', 'Purchase'];

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

export default function MyActivityScreen() {
  const route = useRoute<any>();
  const employeeId: string = route.params?.employeeId;

  const [logs, setLogs] = useState<ActivityLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState('General');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [desc, setDesc] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true); setError(null);
    try { setLogs(await service.getMyActivities(employeeId)); }
    catch (e: any) { setError(`Failed to load activity: ${e.message ?? e}`); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const post = async () => {
    if (!desc.trim()) return Alert.alert('Please write what you did');
    setPosting(true);
    try {
      await service.postMyActivity({ employeeId, module: selectedModule, description: desc.trim() });
      setDesc('');
      Alert.alert('Activity posted');
      await load();
    } catch (e: any) {
      Alert.alert('Failed to post', String(e.message ?? e));
    } finally { setPosting(false); }
  };

  const filtered = useMemo(() => moduleFilter === 'All' ? logs : logs.filter((l) => l.module === moduleFilter), [logs, moduleFilter]);

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  if (error) return <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>;

  return (
    <View style={styles.flex}>
      <View style={styles.header}><Text style={styles.headerTitle}>My activity</Text></View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <View style={styles.postCard}>
          <Text style={styles.postLabel}>What did you do today?</Text>
          <View style={styles.pickerBox}>
            <Picker selectedValue={selectedModule} onValueChange={setSelectedModule}>
              {MODULES.map((m) => <Picker.Item key={m} label={m} value={m} />)}
            </Picker>
          </View>
          <View style={styles.descBox}>
            <TextInput
              style={styles.descInput} multiline numberOfLines={3}
              placeholder="Describe what you did" placeholderTextColor={AppColors.textMuted}
              value={desc} onChangeText={setDesc}
            />
          </View>
          <TouchableOpacity style={[styles.postButton, posting && { opacity: 0.6 }]} onPress={post} disabled={posting}>
            {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionLabel}>My history</Text>
          <View style={styles.filterPickerBox}>
            <Picker selectedValue={moduleFilter} onValueChange={setModuleFilter} style={{ width: 130 }}>
              <Picker.Item label="All" value="All" />
              {MODULES.map((m) => <Picker.Item key={m} label={m} value={m} />)}
            </Picker>
          </View>
        </View>

        {filtered.length === 0 ? (
          <Text style={styles.emptyText}>No activity recorded yet</Text>
        ) : filtered.map((log) => (
          <View key={log.id} style={styles.logCard}>
            <View style={styles.logIcon}><Icon name={moduleIcon(log.module)} color={AppColors.primary} size={16} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logModule}>{log.module}</Text>
              {log.description ? <Text style={styles.logDesc}>{log.description}</Text> : null}
              <Text style={styles.logTime}>{log.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {log.createdAt.toLocaleDateString()}</Text>
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
  header: { padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  postCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  postLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 10 },
  pickerBox: { backgroundColor: AppColors.background, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, marginBottom: 10 },
  descBox: { backgroundColor: AppColors.background, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12 },
  descInput: { color: AppColors.textPrimary, fontSize: 14, minHeight: 70, textAlignVertical: 'top' },
  postButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  postButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 10 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600' },
  filterPickerBox: { backgroundColor: AppColors.surface, borderRadius: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, marginTop: 10 },
  logCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10, gap: 12 },
  logIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  logModule: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '700' },
  logDesc: { color: AppColors.textSecondary, fontSize: 12, marginTop: 3 },
  logTime: { color: AppColors.textMuted, fontSize: 11, marginTop: 4 },
});