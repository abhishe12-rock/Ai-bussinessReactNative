
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Roles & Permissions</Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}><Text style={{ color: AppColors.danger, fontSize: 12.5, fontWeight: '500' }}>{error}</Text></View>
      ) : roles.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No roles configured yet</Text></View>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
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

      <TouchableOpacity style={styles.fab} onPress={() => setDialogOpen(true)} activeOpacity={0.8}>
        <Icon name="add" color="#fff" size={18} />
        <Text style={styles.fabText}>Add role</Text>
      </TouchableOpacity>

      <Modal visible={dialogOpen} transparent animationType="fade" onRequestClose={() => setDialogOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Add New Role</Text>
            <TextInput style={styles.dialogInput} placeholder="Role title (e.g. Sales Lead)" placeholderTextColor={AppColors.textMuted} value={newRoleName} onChangeText={setNewRoleName} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setDialogOpen(false)}><Text style={styles.dialogCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setDialogOpen(false)}><Text style={styles.dialogAdd}>Create</Text></TouchableOpacity>
            </View>
          </View>
        </View>
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
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: AppColors.primarySoft,
    borderWidth: 1,
    borderColor: `${AppColors.primary}35`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  cardDesc: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primary,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 7,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surfaceElevated, borderRadius: 20, padding: 22, width: '85%', borderWidth: 1, borderColor: AppColors.border },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 15.5, fontWeight: '700', marginBottom: 12 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: AppColors.textPrimary, fontSize: 13.5, backgroundColor: AppColors.surfaceInput },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 16 },
  dialogCancel: { color: AppColors.textSecondary, fontSize: 13.5, fontWeight: '600' },
  dialogAdd: { color: AppColors.primary, fontWeight: '700', fontSize: 13.5 },
});