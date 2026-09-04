import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, FlatList, ActivityIndicator, Alert, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { CustomerService, CustomerRecord } from '../../services/CustomerService';
import { EmployeeService, EmployeeRecord } from '../../services/EmployeeService';
import { RepairService } from '../../services/RepairService';
import { AppColors } from '../theme/AppColors';

const customerService = new CustomerService();
const employeeService = new EmployeeService();
const repairService = new RepairService();

export default function CreateRepairScreen() {
  const navigation = useNavigation<any>();

  const [device, setDevice] = useState('');
  const [problem, setProblem] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const employees = await employeeService.getEmployees();
        setEmployees(employees);
      } catch (_) {
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  const pickCustomer = () => {
    setPickerOpen(true);
  };

  const save = async () => {
    if (!selectedCustomer) {
      Alert.alert('Please select a customer');
      return;
    }
    if (!device.trim() || !problem.trim()) {
      Alert.alert('Device and problem description are required');
      return;
    }
    if (!selectedTechnicianId) {
      Alert.alert('Please assign a technician');
      return;
    }

    setSaving(true);
    try {
      await repairService.createOfflineRepair({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        address: selectedCustomer.address ?? undefined,
        device: device.trim(),
        problemDescription: problem.trim(),
        assignedTo: selectedTechnicianId,
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed to create repair: ' + String(e.message ?? e));
    } finally {
      setSaving(false);
    }
  };

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
          <Text style={styles.headerTitle}>New repair</Text>
        </View>
      </View>
      {loadingLookups ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Customer</Text>
          <TouchableOpacity style={styles.customerCard} onPress={pickCustomer}>
            {!selectedCustomer ? (
              <>
                <Icon name="person-add-alt-1" color={AppColors.textMuted} size={20} />
                <Text style={styles.selectCustomerText}>Select a customer</Text>
                <View style={{ flex: 1 }} />
                <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
              </>
            ) : (
              <>
                <View style={styles.customerAvatar}>
                  <Text style={styles.customerAvatarText}>
                    {selectedCustomer.name.trim() ? selectedCustomer.name.trim()[0].toUpperCase() : '?'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{selectedCustomer.name}</Text>
                  <Text style={styles.customerPhone}>{selectedCustomer.phone}</Text>
                </View>
                <Text style={styles.changeText}>Change</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Repair details</Text>
          <View style={styles.fieldBox}>
            <Icon name="phone-android" color={AppColors.textMuted} size={20} />
            <TextInput style={styles.fieldInput} placeholder="Device *" placeholderTextColor={AppColors.textMuted} value={device} onChangeText={setDevice} />
          </View>
          <View style={styles.fieldBox}>
            <Icon name="build" color={AppColors.textMuted} size={20} />
            <TextInput
              style={[styles.fieldInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Problem description *" placeholderTextColor={AppColors.textMuted}
              value={problem} onChangeText={setProblem} multiline
            />
          </View>

          <Text style={styles.sectionLabel}>Assign technician</Text>
          <View style={styles.pickerBox}>
            <Icon name="engineering" color={AppColors.textMuted} size={20} />
            <View style={{ flex: 1 }}>
              <Picker
                selectedValue={selectedTechnicianId ?? ''}
                onValueChange={(v) => setSelectedTechnicianId(v === '' ? null : String(v))}
                enabled={employees.length > 0}
              >
                <Picker.Item label={employees.length === 0 ? 'No employees yet' : 'Select technician'} value="" />
                {employees.map((e) => <Picker.Item key={e.id} label={e.fullName} value={e.id} />)}
              </Picker>
            </View>
          </View>

          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Create repair ticket</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}

      <CustomerPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPicked={(c) => { setSelectedCustomer(c); setPickerOpen(false); }}
      />
    </View>
  );
}

function CustomerPickerModal({ visible, onClose, onPicked }: {
  visible: boolean; onClose: () => void; onPicked: (c: CustomerRecord) => void;
}) {
  const navigation = useNavigation<any>(); // ← ADD THIS

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (visible) {
      (async () => {
        setLoading(true);
        try {
          const data = await customerService.getCustomers();
          setCustomers(data);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [visible]);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) || c.phone.includes(query)
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="chevron-left" color={AppColors.primary} size={30} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select customer</Text>
          </View>
        </View>
        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Icon name="search" color={AppColors.textMuted} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name / mobile"
              placeholderTextColor={AppColors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
          </View>
        </View>
        {loading ? (
          <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerFill}><Text style={styles.emptyText}>No customers found</Text></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => {
              const initials = item.name.trim() ? item.name.trim()[0].toUpperCase() : '?';
              return (
                <TouchableOpacity style={styles.customerListCard} onPress={() => onPicked(item)}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                  <View>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardPhone}>{item.phone}</Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  content: { padding: 16, paddingBottom: 84 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  customerCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 14, gap: 10,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  customerAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  customerAvatarText: { color: AppColors.primary, fontWeight: '700' },
  customerName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  customerPhone: { color: AppColors.textSecondary, fontSize: 12.5 },
  changeText: { color: AppColors.primary, fontSize: 12.5, fontWeight: '600' },
  selectCustomerText: { color: AppColors.textMuted, fontSize: 14 },
  fieldBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12, gap: 10 },
  fieldInput: { flex: 1, color: AppColors.textPrimary, fontSize: 14, paddingVertical: 0 },
  pickerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, gap: 10 },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  searchWrap: { padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14 },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  customerListCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 14, gap: 12,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  avatar: { width: 42, height: 42, borderRadius: 10, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: AppColors.primary, fontWeight: '700' },
  cardName: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  cardPhone: { color: AppColors.textSecondary, fontSize: 12.5 },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    marginLeft: -6,
  },
});