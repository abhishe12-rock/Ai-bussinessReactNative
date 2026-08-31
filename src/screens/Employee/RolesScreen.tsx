
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Modal, TextInput } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { EmployeeService, RoleRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();

const ICON_FOR: Record<string, any> = {
  Admin: 'shield', Manager: 'manage-accounts', 'Sales Executive': 'point-of-sale',
  'Inventory Manager': 'inventory-2', Accountant: 'calculate', Technician: 'build', HR: 'groups',
};

export default function RolesScreen() {
  const navigation = useNavigation<any>();
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setRoles(await service.getRoles()); }
    catch (e: any) { setError(`Failed to load roles: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Roles</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5 }}>{error}</Text></View>
      ) : roles.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No roles yet — run the seed insert or tap Add role</Text></View>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.iconWrap}><Icon name={ICON_FOR[item.name] ?? 'badge'} color={AppColors.primary} size={20} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
              </View>
              <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setDialogOpen(true)}>
        <Icon name="add" color="#fff" size={20} />
        <Text style={styles.fabText}>Add role</Text>
      </TouchableOpacity>

      <Modal visible={dialogOpen} transparent animationType="fade" onRequestClose={() => setDialogOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Add role</Text>
            <TextInput style={styles.dialogInput} placeholder="Role name" placeholderTextColor={AppColors.textMuted} value={newRoleName} onChangeText={setNewRoleName} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setDialogOpen(false)}><Text style={styles.dialogCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setDialogOpen(false)}><Text style={styles.dialogAdd}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, gap: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  cardDesc: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surface, borderRadius: 16, padding: 20, width: '85%' },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, padding: 12, color: AppColors.textPrimary },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
  dialogCancel: { color: AppColors.textSecondary, fontSize: 14 },
  dialogAdd: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },
});