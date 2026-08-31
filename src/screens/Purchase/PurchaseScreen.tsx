import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { PurchaseService, PurchaseRecord } from '../../services/PurchaseService';
import { SupplierService } from '../../services/SupplierService';
import { AppColors } from '../theme/AppColors';

const purchaseService = new PurchaseService();
const supplierService = new SupplierService();

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

export default function PurchaseHomeScreen() {
  const navigation = useNavigation<any>();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [supplierCount, setSupplierCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([purchaseService.getAllPurchases(), supplierService.getSuppliers()]);
      setPurchases(p); setSupplierCount(s.length);
    } catch { /* stats just show placeholders on failure */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openOrders = purchaseService.countByStatus(purchases, 'Pending') + purchaseService.countByStatus(purchases, 'Partially Received');
  const pendingReceiving = purchases.filter((p) => p.status !== 'Received').length;
  const monthSpend = purchaseService.sumTotalForMonth(purchases, new Date());
  const recent = purchases.slice(0, 3);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
  <View style={styles.headerLeft}>
    <TouchableOpacity 
      onPress={() => navigation.goBack()}
      style={styles.backBtn}
    >
      <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
    </TouchableOpacity>
    <View>
      <Text style={styles.headerTitle}>Purchase</Text>
      <Text style={styles.headerSubtitle}>Orders, suppliers and receiving</Text>
    </View>
  </View>
</View>

      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <View style={styles.statsRow}>
          <StatCard label="Open orders" value={loading ? '—' : `${openOrders}`} bg={AppColors.primarySoft} fg={AppColors.primary} />
          <StatCard label="Pending receiving" value={loading ? '—' : `${pendingReceiving}`} bg={AppColors.warningSoft} fg={AppColors.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="This month spend" value={loading ? '—' : `₹${monthSpend.toFixed(0)}`} bg={AppColors.infoSoft} fg={AppColors.info} />
          <StatCard label="Active suppliers" value={loading ? '—' : `${supplierCount}`} bg={AppColors.successSoft} fg={AppColors.success} />
        </View>

        <Text style={styles.sectionLabel}>Manage</Text>
        <MenuRow icon="description" iconColor={AppColors.primary} iconBg={AppColors.primarySoft} title="Purchase orders" subtitle={`${openOrders} open orders`}
          onPress={async () => { navigation.navigate('PurchaseOrders', { onChanged: load }); }} />
        <MenuRow icon="history" iconColor={AppColors.success} iconBg={AppColors.successSoft} title="Purchase history" subtitle="Past purchase orders"
          onPress={() => navigation.navigate('PurchaseHistory')} />
        <MenuRow icon="inventory" iconColor={AppColors.warning} iconBg={AppColors.warningSoft} title="Stock receiving" subtitle={`${pendingReceiving} shipments awaiting receipt`}
          onPress={async () => { navigation.navigate('PurchaseOrders', { onChanged: load }); }} />

        <Text style={styles.sectionLabel}>Recent purchase orders</Text>
        {loading ? (
          <ActivityIndicator color={AppColors.primary} style={{ marginTop: 10 }} />
        ) : recent.length === 0 ? (
          <Text style={styles.emptyText}>No purchase orders yet</Text>
        ) : recent.map((p) => (
          <TouchableOpacity
            key={p.id} style={styles.poCard}
            onPress={async () => { navigation.navigate('PurchaseDetails', { purchase: p, onChanged: load }); }}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.poTopRow}>
                <Text style={styles.poNumber}>{p.purchaseNumber}</Text>
                <View style={[styles.statusPill, { backgroundColor: statusBg(p.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(p.status) }]}>{p.status}</Text>
                </View>
              </View>
              <Text style={styles.poSupplier} numberOfLines={1}>{p.supplierName ?? 'Unknown supplier'}</Text>
              <Text style={styles.poDate}>{p.purchaseDate.toLocaleDateString()}</Text>
            </View>
            <Text style={styles.poTotal}>₹{p.total.toFixed(0)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={async () => { navigation.navigate('CreatePurchaseOrder', { onSaved: load }); }}>
        <Icon name="add" color="#fff" size={20} />
        <Text style={styles.fabText}>New PO</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatCard({ label, value, bg, fg }: { label: string; value: string; bg: string; fg: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg, flex: 1 }]}>
      <Text style={[styles.statLabel, { color: fg }]}>{label}</Text>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
    </View>
  );
}

function MenuRow({ icon, iconColor, iconBg, title, subtitle, onPress }: {
  icon: any; iconColor: string; iconBg: string; title: string; subtitle: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}><Icon name={icon} color={iconColor} size={18} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron-right" color={AppColors.textMuted} size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { padding: 16, paddingTop: 50, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  headerSubtitle: { fontSize: 12.5, color: AppColors.textSecondary, marginTop: 2 },
  content: { padding: 16, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { borderRadius: 14, padding: 13 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statValue: { fontSize: 17, fontWeight: '800', marginTop: 5 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 10 },
  menuRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  menuSubtitle: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 2 },
  emptyText: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 10 },
  poCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13, marginBottom: 10, gap: 8 },
  poTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  poNumber: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '600' },
  poSupplier: { color: AppColors.textSecondary, fontSize: 12, marginTop: 4 },
  poDate: { color: AppColors.textMuted, fontSize: 11, marginTop: 2 },
  poTotal: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  fab: { position: 'absolute', right: 20, bottom: 100, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  headerLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},
backBtn: {
  padding: 4,
},
});