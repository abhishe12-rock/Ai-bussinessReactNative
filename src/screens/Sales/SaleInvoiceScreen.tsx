import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { SalesService, SaleRecord, SaleItemRecord, PaymentRecord } from '../../services/SalesService';
import { AppColors } from '../theme/AppColors';

const service = new SalesService();

function statusColor(status: string) {
  if (status === 'Paid') return AppColors.success;
  if (status === 'Partial') return AppColors.warning;
  return AppColors.danger;
}
function statusBg(status: string) {
  if (status === 'Paid') return AppColors.successSoft;
  if (status === 'Partial') return AppColors.warningSoft;
  return AppColors.dangerSoft;
}

export default function SaleInvoiceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const sale: SaleRecord = route.params.sale;

  const [items, setItems] = useState<SaleItemRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [i, p] = await Promise.all([service.getSaleItems(sale.id), service.getPaymentsForSale(sale.id)]);
      setItems(i); setPayments(p);
    } catch (e: any) {
      Alert.alert('Failed to load', String(e.message ?? e));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const remaining = Math.max(0, sale.total - sale.paidAmount);

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{sale.invoiceNumber}</Text>
        <TouchableOpacity><Icon name="share" color={AppColors.textSecondary} size={20} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.customerCard}>
          <View style={styles.customerIcon}><Icon name="person-outline" color={AppColors.primary} size={21} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{sale.customerName ?? 'Unknown customer'}</Text>
            <Text style={styles.customerDate}>{sale.createdAt.toLocaleDateString()}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusBg(sale.paymentStatus) }]}>
            <Text style={[styles.statusText, { color: statusColor(sale.paymentStatus) }]}>{sale.paymentStatus}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Items</Text>
        <View style={styles.itemsCard}>
          {items.map((item, i) => (
            <View key={item.id} style={[styles.itemRow, i !== items.length - 1 && styles.itemRowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemMeta}>₹{item.price.toFixed(0)} × {item.quantity}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{item.total.toFixed(0)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Row label="Subtotal" value={`₹${sale.subtotal.toFixed(0)}`} />
          <Row label={`Discount (${sale.discountPercent.toFixed(0)}%)`} value={`- ₹${sale.discountAmount.toFixed(0)}`} />
          <Row label={`Tax (${sale.taxPercent.toFixed(0)}%)`} value={`+ ₹${sale.taxAmount.toFixed(0)}`} />
          <View style={styles.divider} />
          <Row label="Total" value={`₹${sale.total.toFixed(0)}`} isTotal />
          <Row label="Paid" value={`₹${sale.paidAmount.toFixed(0)}`} color={AppColors.success} />
          {remaining > 0 && <Row label="Due" value={`₹${remaining.toFixed(0)}`} color={AppColors.danger} />}
        </View>

        <Text style={styles.sectionLabel}>Payment history</Text>
        {payments.length === 0 ? (
          <View style={styles.emptyPayments}><Text style={styles.emptyPaymentsText}>No payments recorded yet</Text></View>
        ) : (
          <View style={styles.itemsCard}>
            {payments.map((p, i) => (
              <View key={p.id} style={[styles.paymentRow, i !== payments.length - 1 && styles.itemRowBorder]}>
                <Icon name="check-circle-outline" color={AppColors.success} size={16} />
                <Text style={styles.paymentMethod}>{p.paymentMethod}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.paymentAmount}>₹{p.amount.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        )}

        {remaining > 0 && (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={async () => { navigation.navigate('PaymentsRecord', { sale, onRecorded: load }); }}
          >
            <Icon name="payments" color="#fff" size={18} />
            <Text style={styles.recordButtonText}>Record payment</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, isTotal, color }: { label: string; value: string; isTotal?: boolean; color?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, isTotal && styles.summaryLabelTotal]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.summaryValue, { color: color ?? AppColors.textPrimary }, isTotal && { fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  customerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  customerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  customerName: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700' },
  customerDate: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 10.5, fontWeight: '700' },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  itemsCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  itemRowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  itemName: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '600' },
  itemMeta: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  itemTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  summaryCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14, marginTop: 20 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { color: AppColors.textSecondary, fontSize: 13 },
  summaryLabelTotal: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 10 },
  emptyPayments: { backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 16, alignItems: 'center' },
  emptyPaymentsText: { color: AppColors.textMuted, fontSize: 12.5 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  paymentMethod: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  paymentAmount: { color: AppColors.success, fontSize: 13, fontWeight: '700' },
  recordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AppColors.primary, borderRadius: 12, height: 48, marginTop: 16 },
  recordButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});