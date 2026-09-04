import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { PurchaseService, PurchaseRecord } from '../../services/PurchaseService';
import { SupplierService } from '../../services/SupplierService';
import { AppColors, AppShadows, AppRadius } from '../theme/AppColors';

const purchaseService = new PurchaseService();
const supplierService = new SupplierService();
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function statusColor(status: string) {
  if (status === 'Received') return '#10B981';
  if (status === 'Partially Received') return '#F59E0B';
  return AppColors.textSecondary;
}
function statusBg(status: string) {
  if (status === 'Received') return '#ECFDF5';
  if (status === 'Partially Received') return '#FFFBEB';
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
      const [p, s] = await Promise.all([
        purchaseService.getAllPurchases(),
        supplierService.getSuppliers(),
      ]);
      setPurchases(p);
      setSupplierCount(s.length);
    } catch {
      // stats show placeholders on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openOrders =
    purchaseService.countByStatus(purchases, 'Pending') +
    purchaseService.countByStatus(purchases, 'Partially Received');
  const pendingReceiving = purchases.filter((p) => p.status !== 'Received').length;
  const monthSpend = purchaseService.sumTotalForMonth(purchases, new Date());
  const recent = purchases.slice(0, 3);

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
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Purchase</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Orders, suppliers and receiving
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerNewPoBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('CreatePurchaseOrder', { onSaved: load })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="add" color="#FFFFFF" size={18} />
          <Text style={styles.headerNewPoText}>New PO</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={AppColors.primary}
          />
        }
      >
        {/* STATS ROW 1 */}
        <View style={styles.statsRow}>
          <StatCard
            label="Open Orders"
            value={loading ? '—' : `${openOrders}`}
            bg="#EEECFE"
            fg="#5B4DF8"
          />
          <StatCard
            label="Pending Receiving"
            value={loading ? '—' : `${pendingReceiving}`}
            bg="#FFFBEB"
            fg="#F59E0B"
          />
        </View>

        {/* STATS ROW 2 */}
        <View style={styles.statsRow}>
          <StatCard
            label="This Month Spend"
            value={loading ? '—' : `₹${monthSpend.toFixed(0)}`}
            bg="#EFF6FF"
            fg="#3B82F6"
          />
          <StatCard
            label="Active Suppliers"
            value={loading ? '—' : `${supplierCount}`}
            bg="#ECFDF5"
            fg="#10B981"
          />
        </View>

        {/* MANAGE SECTION */}
        <Text style={styles.sectionLabel}>Manage</Text>

        <MenuRow
          icon="description"
          iconColor="#5B4DF8"
          iconBg="#EEECFE"
          title="Purchase Orders"
          subtitle={`${openOrders} open orders`}
          onPress={async () => {
            navigation.navigate('PurchaseOrders', { onChanged: load });
          }}
        />

        <MenuRow
          icon="history"
          iconColor="#10B981"
          iconBg="#ECFDF5"
          title="Purchase History"
          subtitle="Past purchase orders"
          onPress={() => navigation.navigate('PurchaseHistory')}
        />

        <MenuRow
          icon="inventory"
          iconColor="#F59E0B"
          iconBg="#FFFBEB"
          title="Stock Receiving"
          subtitle={`${pendingReceiving} shipments awaiting receipt`}
          onPress={async () => {
            navigation.navigate('PurchaseOrders', { onChanged: load });
          }}
        />

        {/* RECENT PURCHASE ORDERS */}
        <Text style={styles.sectionLabel}>Recent Purchase Orders</Text>
        {loading ? (
          <ActivityIndicator color={AppColors.primary} style={{ marginTop: 14 }} />
        ) : recent.length === 0 ? (
          <Text style={styles.emptyText}>No purchase orders yet</Text>
        ) : (
          recent.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.poCard}
              activeOpacity={0.75}
              onPress={async () => {
                navigation.navigate('PurchaseDetails', {
                  purchase: p,
                  onChanged: load,
                });
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.poTopRow}>
                  <Text style={styles.poNumber}>#{p.purchaseNumber}</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: statusBg(p.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusColor(p.status) },
                      ]}
                    >
                      {p.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.poSupplier} numberOfLines={1}>
                  {p.supplierName ?? 'Unknown supplier'}
                </Text>
                <Text style={styles.poDate}>
                  {new Date(p.purchaseDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.poTotal}>₹{Number(p.total).toFixed(0)}</Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  bg,
  fg,
}: {
  label: string;
  value: string;
  bg: string;
  fg: string;
}) {
  return (
    <View style={[styles.statCard, { flex: 1 }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
    </View>
  );
}

function MenuRow({
  icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} color={iconColor} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron-right" color={AppColors.textMuted} size={22} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

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
    flex: 1,
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
  headerSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 1,
    fontWeight: '500',
  },
  headerNewPoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 16,
    ...AppShadows.subtle,
  },
  headerNewPoText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },

  /* STATS ROWS */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    ...AppShadows.subtle,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: -0.3,
  },

  /* SECTION LABEL */
  sectionLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  /* MENU ROW */
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...AppShadows.card,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  menuSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },

  emptyText: {
    color: AppColors.textSecondary,
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },

  /* PO CARD */
  poCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    marginBottom: 10,
    gap: 10,
    ...AppShadows.card,
  },
  poTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  poNumber: {
    color: AppColors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  poSupplier: {
    color: AppColors.textPrimary,
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 4,
  },
  poDate: {
    color: AppColors.textMuted,
    fontSize: 11.5,
    marginTop: 2,
  },
  poTotal: {
    color: AppColors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});