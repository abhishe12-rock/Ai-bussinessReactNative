import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Switch, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { EmployeeService, EmployeeRecord, RoleRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();

const DEFAULT_MODULE_ACCESS: Record<string, boolean> = {
  Dashboard: true, 'AI Assistant': true, Customers: true, Inventory: true, Sales: true,
  Purchase: false, Orders: true, Repairs: false, Finance: false, Employees: false,
  Reports: true, Documents: false, 'AI Agents': false, 'MCP Tools': false, 'AI Insights': false,
  Notifications: true, Settings: false, Admin: false,
};

export default function ManageAccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const employee: EmployeeRecord = route.params.employee;

  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({ ...DEFAULT_MODULE_ACCESS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rolesData = await service.getRoles();
        setRoles(rolesData);

        const currentRoleId = await service.getEmployeeRole(employee.id);
        if (currentRoleId) {
          setSelectedRoleId(currentRoleId);
          const permissions = await service.getRolePermissions(currentRoleId);
          setModuleAccess((prev) => {
            const reset = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
            Object.entries(permissions).forEach(([module, canAccess]) => {
              if (module in reset) reset[module] = canAccess;
            });
            return reset;
          });
        }
      } catch (e) {
        console.log('Manage access load failed', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onRoleChange = async (roleId: string) => {
    setSelectedRoleId(roleId);
    try {
      const permissions = await service.getRolePermissions(roleId);
      setModuleAccess((prev) => {
        const reset = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
        Object.entries(permissions).forEach(([module, canAccess]) => {
          if (module in reset) reset[module] = canAccess;
        });
        return reset;
      });
    } catch (e) {
      console.log('Failed to load role permissions', e);
    }
  };

  const save = async () => {
    if (!selectedRoleId) return Alert.alert('Select a role first');
    setSaving(true);
    try {
      await service.assignRole({ employeeId: employee.id, roleId: selectedRoleId });
      await service.saveRolePermissions({ roleId: selectedRoleId, moduleAccess });
      Alert.alert('Access updated successfully');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed', String(e.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage access</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.employeeCard}>
          <View style={styles.employeeIcon}><Icon name="person-outline" color={AppColors.primary} size={19} /></View>
          <Text style={styles.employeeName}>{employee.fullName}</Text>
        </View>

        <Text style={styles.sectionLabel}>Role</Text>
        <View style={styles.pickerBox}>
          <Picker selectedValue={selectedRoleId ?? ''} onValueChange={(v) => onRoleChange(String(v))}>
            <Picker.Item label={roles.length === 0 ? 'No roles yet' : 'Select role'} value="" />
            {roles.map((r) => <Picker.Item key={r.id} label={r.name} value={r.id} />)}
          </Picker>
        </View>

        <Text style={styles.sectionLabel}>Module access</Text>
        <View style={styles.moduleCard}>
          {Object.keys(moduleAccess).map((module, i, arr) => (
            <View key={module} style={[styles.moduleRow, i !== arr.length - 1 && styles.moduleRowBorder]}>
              <Text style={styles.moduleLabel}>{module}</Text>
              <Switch
                value={moduleAccess[module]}
                onValueChange={(v) => setModuleAccess((prev) => ({ ...prev, [module]: v }))}
                trackColor={{ true: AppColors.primary }}
              />
            </View>
          ))}
        </View>

        <View style={styles.noticeBox}>
          <Icon name="info-outline" color={AppColors.info} size={18} />
          <Text style={styles.noticeText}>Fine-grained View/Create/Edit/Delete permissions per module are managed in Roles → Permissions.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save access</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  employeeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  employeeIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  employeeName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 10 },
  pickerBox: { backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border },
  moduleCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  moduleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  moduleRowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  moduleLabel: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '500' },
  noticeBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: AppColors.infoSoft, borderRadius: 12, padding: 12, marginTop: 16 },
  noticeText: { flex: 1, color: AppColors.info, fontSize: 12, fontWeight: '500' },
  footer: { padding: 16, backgroundColor: AppColors.surface, borderTopWidth: 1, borderColor: AppColors.border },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});