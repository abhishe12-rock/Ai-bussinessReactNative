import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { PurchaseService, PurchaseRecord, PurchaseItemRecord, purchaseItemFullyReceived } from '../../services/PurchaseService';
import { AppColors } from '../theme/AppColors';

const service = new PurchaseService();

function statusColor(status: string) {
  if (status === 'Received') return AppColors.success;
  if (status === 'Partially Received') return AppColors.warning;
  return AppColors.textSecondary;
}
function statusBg(status: string) {
  if (status === 'Received') return AppColors.successSoft;
  if (status === 'Partially Received') return AppColors.warningSoft;
  return AppColors.surfaceSoft;
}

export default function PurchaseDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const purchase: PurchaseRecord = route.params.purchase;
  const onChanged: (() => void) | undefined = route.params?.onChanged;

  const [items, setItems] = useState<PurchaseItemRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setItems(await service.getPurchaseItems(purchase.id)); }
    catch (e: any) { Alert.alert('Failed to load', String(e.message ?? e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const remaining = Math.max(0, purchase.total - purchase.paidAmount);
  const fullyReceived = purchase.status === 'Received';

  if (loading) return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{purchase.purchaseNumber}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.statusPill, { backgroundColor: statusBg(purchase.status), alignSelf: 'flex-start' }]}>
          <Text style={[styles.statusText, { color: statusColor(purchase.status) }]}>{purchase.status}</Text>
        </View>

        <Text style={styles.sectionLabel}>Supplier</Text>
        <View style={styles.supplierCard}>
          <View style={styles.supplierIcon}><Icon name="local-shipping" color={AppColors.info} size={19} /></View>
          <Text style={styles.supplierName}>{purchase.supplierName ?? 'Unknown supplier'}</Text>
        </View>

        <Text style={styles.sectionLabel}>Products</Text>
        <View style={styles.itemsCard}>
          {items.map((item, i) => (
            <View key={item.id} style={[styles.itemRow, i !== items.length - 1 && styles.itemRowBorder]}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemTotal}>₹{item.total.toFixed(0)}</Text>
              </View>
              <View style={styles.itemMetaRow}>
                <Text style={styles.itemMeta}>Ordered {item.quantity}</Text>
                <Text style={[styles.itemMeta, { color: purchaseItemFullyReceived(item) ? AppColors.success : AppColors.warning, fontWeight: '600' }]}>Received {item.receivedQuantity}</Text>
                <Text style={styles.itemMetaMuted}>₹{item.purchasePrice.toFixed(0)} each</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Total</Text>
        <View style={styles.summaryCard}>
          <Row label="Subtotal" value={`₹${purchase.subtotal.toFixed(0)}`} />
          <Row label="Discount" value={`- ₹${purchase.discountAmount.toFixed(0)}`} />
          <Row label="Tax" value={`+ ₹${purchase.taxAmount.toFixed(0)}`} />
          <View style={styles.divider} />
          <Row label="Total" value={`₹${purchase.total.toFixed(0)}`} isTotal />
        </View>

        <Text style={styles.sectionLabel}>Payment</Text>
        <View style={styles.summaryCard}>
          <Row label="Paid" value={`₹${purchase.paidAmount.toFixed(0)}`} color={AppColors.success} />
          <Row label="Remaining" value={`₹${remaining.toFixed(0)}`} color={remaining > 0 ? AppColors.danger : AppColors.success} />
          <Text style={styles.statusNote}>Status: {purchase.paymentStatus}</Text>
        </View>

        {!fullyReceived && (
          <TouchableOpacity
            style={styles.receiveButton}
            onPress={async () => { navigation.navigate('StockReceiving', { purchase, onReceived: () => { load(); onChanged?.(); } }); }}
          >
            <Icon name="inventory" color="#fff" size={18} />
            <Text style={styles.receiveButtonText}>Receive stock</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function Row({ label, value, isTotal, color }: { label: string; value: string; isTotal?: boolean; color?: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, isTotal && styles.rowLabelTotal]}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={[styles.rowValue, { color: color ?? AppColors.textPrimary }, isTotal && { fontSize: 16 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 24 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 18, marginBottom: 8 },
  supplierCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14, gap: 12 },
  supplierIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: AppColors.infoSoft, alignItems: 'center', justifyContent: 'center' },
  supplierName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  itemsCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border },
  itemRow: { paddingHorizontal: 14, paddingVertical: 12 },
  itemRowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  itemTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  itemMetaRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  itemMeta: { color: AppColors.textSecondary, fontSize: 12 },
  itemMetaMuted: { color: AppColors.textMuted, fontSize: 11.5 },
  summaryCard: { backgroundColor: AppColors.surface, borderRadius: 16, borderWidth: 1, borderColor: AppColors.border, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rowLabel: { color: AppColors.textSecondary, fontSize: 13 },
  rowLabelTotal: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  rowValue: { fontSize: 13, fontWeight: '700' },
  divider: { height: 1, backgroundColor: AppColors.border, marginVertical: 10 },
  statusNote: { color: AppColors.textSecondary, fontSize: 12, marginTop: 4 },
  receiveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AppColors.primary, borderRadius: 12, height: 50, marginTop: 20 },
  receiveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});