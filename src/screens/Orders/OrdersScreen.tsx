import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import {
  OrderService,
  OrderRecord,
  OrderStatus,
  orderStatusToString,
} from '../../services/OrderService';
import { AppColors, AppShadows, AppRadius } from '../theme/AppColors';
import { FadeInUp, SpringTouch } from '../theme/Animations';

const service = new OrderService();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TABS: { key: OrderStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

function statusColor(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return '#F59E0B';
    case 'processing':
      return '#3B82F6';
    case 'delivered':
      return '#10B981';
    case 'cancelled':
      return '#EF4444';
  }
}

function statusBg(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return '#FFFBEB';
    case 'processing':
      return '#EFF6FF';
    case 'delivered':
      return '#ECFDF5';
    case 'cancelled':
      return '#FEF2F2';
  }
}

function statusIcon(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'schedule';
    case 'processing':
      return 'sync';
    case 'delivered':
      return 'check-circle-outline';
    case 'cancelled':
      return 'cancel';
  }
}

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await service.getAllOrders());
    } catch (e: any) {
      setError(`Failed to load orders: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesTab = o.status === activeTab;
      const matchesQuery =
        !searchQuery.trim() ||
        o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.customerName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [orders, activeTab, searchQuery]);

  return (
    <View style={styles.flex}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="arrow-back-ios" color={AppColors.textPrimary} size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Orders</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={load}
            activeOpacity={0.7}
          >
            <Icon name="refresh" size={22} color={AppColors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={AppColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders or customers..."
            placeholderTextColor={AppColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={18} color={AppColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* SEGMENTED FILTER TABS */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <SpringTouch
                key={tab.key}
                activeScale={0.95}
                onPress={() => setActiveTab(tab.key)}
              >
                <View style={[styles.tabBtn, isActive && styles.tabBtnActive]}>
                  <Text
                    style={[
                      styles.tabBtnText,
                      isActive && styles.tabBtnTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </View>
              </SpringTouch>
            );
          })}
        </ScrollView>
      </View>

      {/* CONTENT LIST */}
      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={AppColors.primary} />
          <Text style={styles.emptySubtitle}>Loading orders...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={36} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconCircle}>
            <Icon name="shopping-bag" size={32} color={AppColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No orders in this status</Text>
          <Text style={styles.emptySubtitle}>
            Orders will appear here as they are placed and updated.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              tintColor={AppColors.primary}
            />
          }
          renderItem={({ item, index }) => (
            <FadeInUp delay={Math.min(index * 35, 300)} distance={12}>
              <SpringTouch
                style={{ width: '100%' }}
                activeScale={0.98}
                onPress={() => {
                  navigation.navigate('OrderDetails', {
                    order: item,
                    onChanged: load,
                  });
                }}
              >
                <View style={styles.orderCard}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.orderIdWrap}>
                      <Icon name="shopping-bag" size={16} color={AppColors.primary} />
                      <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: statusBg(item.status) },
                      ]}
                    >
                      <Icon
                        name={statusIcon(item.status)}
                        size={12}
                        color={statusColor(item.status)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: statusColor(item.status) },
                        ]}
                      >
                        {orderStatusToString(item.status)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.customerName} numberOfLines={1}>
                    {item.customerName ?? 'Walk-in Customer'}
                  </Text>

                  <View style={styles.cardBottomRow}>
                    <Text style={styles.orderDate}>
                      {new Date(item.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.orderTotal}>
                      ₹{Number(item.total).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              </SpringTouch>
            </FadeInUp>
          )}
          ListFooterComponent={<View style={{ height: 24 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: AppColors.background,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },

  /* SEARCH BAR */
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },

  /* SEGMENTED TABS */
  tabsContainer: {
    marginBottom: 12,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  tabBtnActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    ...AppShadows.glow,
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* LIST CONTENT */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  orderCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderIdWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderNumber: {
    fontSize: 13.5,
    fontWeight: '700',
    color: AppColors.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.borderSubtle,
  },
  orderDate: {
    fontSize: 12,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },

  /* EMPTY & CENTER STATES */
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  retryBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 14,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});