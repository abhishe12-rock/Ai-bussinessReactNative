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
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{supplier.name}</Text>
        </View>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { marginLeft: -6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 32 },
  statBox: {
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: AppColors.border,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, opacity: 0.85 },
  statValue: { fontSize: 17, fontWeight: '800', marginTop: 5 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
  recordCard: {
    backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12, marginBottom: 8,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  recordTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  poNumber: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  statusPill: { backgroundColor: AppColors.successSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { color: AppColors.success, fontSize: 10, fontWeight: '700' },
  amount: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  itemsText: { color: AppColors.textSecondary, fontSize: 12, marginTop: 5 },
  dateText: { color: AppColors.textMuted, fontSize: 11, marginTop: 3 },
});