import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { SupplierRecord } from '../../services/SupplierService';
import { AppColors } from '../theme/AppColors';

// TODO: replace with a real query once a `purchase_orders` table exists,
// e.g. select * from purchase_orders where supplier_id = supplier.id
const RECORDS: { poNumber: string; date: string; items: string; amount: string; status: string }[] = [];

export default function SupplierPurchaseHistoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const supplier: SupplierRecord = route.params.supplier;

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{supplier.name}</Text>
        <View style={{ width: 22 }} />
      </View>

      {RECORDS.length === 0 ? (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconWrap}><Icon name="receipt-long" color={AppColors.primary} size={26} /></View>
          <Text style={styles.emptyTitle}>No purchase history yet</Text>
          <Text style={styles.emptySubtitle}>This will show once you create purchase orders for this supplier</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.statBox, { backgroundColor: AppColors.primarySoft }]}>
            <Text style={[styles.statLabel, { color: AppColors.primary }]}>Total orders</Text>
            <Text style={[styles.statValue, { color: AppColors.primary }]}>{RECORDS.length}</Text>
          </View>

          <Text style={styles.sectionLabel}>Purchase history</Text>
          {RECORDS.map((r, i) => (
            <View key={i} style={styles.recordCard}>
              <View style={styles.recordTopRow}>
                <Text style={styles.poNumber}>{r.poNumber}</Text>
                <View style={styles.statusPill}><Text style={styles.statusText}>{r.status}</Text></View>
                <View style={{ flex: 1 }} />
                <Text style={styles.amount}>{r.amount}</Text>
              </View>
              <Text style={styles.itemsText} numberOfLines={1}>{r.items}</Text>
              <Text style={styles.dateText}>{r.date}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 24 },
  statBox: { borderRadius: 14, padding: 13 },
  statLabel: { fontSize: 11, opacity: 0.85 },
  statValue: { fontSize: 17, fontWeight: '800', marginTop: 5 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  recordCard: { backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10 },
  recordTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  poNumber: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  statusPill: { backgroundColor: AppColors.successSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusText: { color: AppColors.success, fontSize: 10, fontWeight: '700' },
  amount: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  itemsText: { color: AppColors.textSecondary, fontSize: 12, marginTop: 5 },
  dateText: { color: AppColors.textMuted, fontSize: 11, marginTop: 3 },
});