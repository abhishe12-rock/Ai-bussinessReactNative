import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { SalesService, SaleRecord } from '../../services/SalesService';
import { AppColors } from '../theme/AppColors';

const service = new SalesService();
type Method = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';
const METHODS: Method[] = ['Cash', 'UPI', 'Card', 'Bank Transfer'];

export default function PaymentsRecordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const sale: SaleRecord = route.params.sale;
  const onRecorded: (() => void) | undefined = route.params?.onRecorded;

  const remaining = Math.max(0, sale.total - sale.paidAmount);
  const [amount, setAmount] = useState(remaining.toFixed(0));
  const [method, setMethod] = useState<Method>('Cash');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) return Alert.alert('Enter a valid amount');

    setSaving(true);
    try {
      await service.recordPayment({ saleId: sale.id, amount: amt, paymentMethod: method });
      onRecorded?.();
      navigation.goBack();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Failed', String(e.message ?? e));
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record payment</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.saleCard}>
          <Text style={styles.invoiceNumber}>{sale.invoiceNumber}</Text>
          <Text style={styles.customerName}>{sale.customerName ?? ''}</Text>
          <View style={styles.totalsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{sale.total.toFixed(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.totalLabel}>Due</Text>
              <Text style={[styles.totalValue, { color: AppColors.danger }]}>₹{remaining.toFixed(0)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Payment method</Text>
        <View style={styles.chipRow}>
          {METHODS.map((m) => {
            const selected = method === m;
            return (
              <TouchableOpacity key={m} style={[styles.chip, selected && styles.chipSelected]} onPress={() => setMethod(m)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.fieldBox}>
          <Icon name="currency-rupee" color={AppColors.textMuted} size={20} />
          <TextInput style={styles.fieldInput} placeholder="Amount received" placeholderTextColor={AppColors.textMuted} value={amount} onChangeText={setAmount} keyboardType="numeric" />
        </View>

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Record payment</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  saleCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  invoiceNumber: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  customerName: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },
  totalsRow: { flexDirection: 'row', marginTop: 12 },
  totalLabel: { color: AppColors.textMuted, fontSize: 11 },
  totalValue: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 2 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border },
  chipSelected: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  chipText: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginTop: 20 },
  fieldInput: { flex: 1, paddingVertical: 14, marginLeft: 10, color: AppColors.textPrimary, fontSize: 14 },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});