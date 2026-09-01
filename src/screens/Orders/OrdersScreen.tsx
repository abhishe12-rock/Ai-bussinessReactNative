import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { OrderService, OrderRecord, OrderStatus, orderStatusToString } from '../../services/OrderService';
import { AppColors } from '../theme/AppColors';

const service = new OrderService();
const TABS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

function statusColor(status: OrderStatus) {
  switch (status) {
    case 'pending': return AppColors.warning;
    case 'processing': return AppColors.info;
    case 'delivered': return AppColors.success;
    case 'cancelled': return AppColors.danger;
  }
}
function statusBg(status: OrderStatus) {
  switch (status) {
    case 'pending': return AppColors.warningSoft;
    case 'processing': return AppColors.infoSoft;
    case 'delivered': return AppColors.successSoft;
    case 'cancelled': return AppColors.dangerSoft;
  }
}
function statusIcon(status: OrderStatus) {
  switch (status) {
    case 'pending': return 'schedule';
    case 'processing': return 'sync';
    case 'delivered': return 'check-circle-outline';
    case 'cancelled': return 'cancel';
  }
}

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setOrders(await service.getAllOrders()); }
    catch (e: any) { setError(`Failed to load orders: ${e.message ?? e}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => orders.filter((o) => o.status === activeTab), [orders, activeTab]);

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
          <View>
            <Text style={styles.headerTitle}>Orders</Text>
            <Text style={styles.headerSubtitle}>Track orders by status</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.key} style={styles.tabItem} onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            {activeTab === tab.key && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}><Text style={styles.emptyText}>No orders here</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={async () => { navigation.navigate('OrderDetails', { order: item, onChanged: load }); }}
            >
              <View style={[styles.cardIcon, { backgroundColor: statusBg(item.status) }]}>
                <Icon name={statusIcon(item.status)} color={statusColor(item.status)} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardNumber}>{item.orderNumber}</Text>
                  <View style={[styles.statusPill, { backgroundColor: statusBg(item.status) }]}>
                    <Text style={[styles.statusText, { color: statusColor(item.status) }]}>{orderStatusToString(item.status)}</Text>
                  </View>
                </View>
                <Text style={styles.cardCustomer}>{item.customerName ?? 'Unknown customer'}</Text>
                <View style={styles.cardBottomRow}>
                  <Text style={styles.cardDate}>{item.createdAt.toLocaleDateString()}</Text>
                  <Text style={styles.cardTotal}>₹{item.total.toFixed(0)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { padding: 16, paddingTop: 50, backgroundColor: AppColors.surface },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  headerSubtitle: { fontSize: 12.5, color: AppColors.textSecondary, marginTop: 2 },
  tabBar: { backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border, flexGrow: 0 },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12 },
  tabText: { color: AppColors.textSecondary, fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: AppColors.primary, fontWeight: '700' },
  tabIndicator: { height: 2, backgroundColor: AppColors.primary, marginTop: 8, borderRadius: 1 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: AppColors.surface, borderRadius: 15, borderWidth: 1, borderColor: AppColors.border, padding: 14, gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardNumber: { flex: 1, color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardCustomer: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '500', marginTop: 4 },
  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  cardDate: { color: AppColors.textMuted, fontSize: 11 },
  cardTotal: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
});