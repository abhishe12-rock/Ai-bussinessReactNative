import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  DrawerActions,
} from '@react-navigation/native';
import Icon, {
  type MaterialIconsIconName,
} from '@react-native-vector-icons/material-icons';
import { supabase } from '../../../lib/supabase';
import { AppColors } from '../../theme/AppColors';

type Params = {
  allowedModules?: Record<string, boolean>;
  employeeName?: string;
  employeeId?: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ============================================================
DASHBOARD STATS - ENHANCED with more stats like Flutter
============================================================ */

type StatItem = {
  title: string;
  value: string;
  delta: string;
  icon: MaterialIconsIconName;
  color: string;
  deltaPositive?: boolean;
};

const STATS: StatItem[] = [
  {
    title: "Today's Sales",
    value: '$12,480',
    delta: '+8.2%',
    icon: 'point-of-sale',
    color: AppColors.primary,
  },
  {
    title: 'Revenue',
    value: '$248,900',
    delta: '+12.4%',
    icon: 'payments',
    color: AppColors.success,
  },
  {
    title: 'Total Customers',
    value: '3,214',
    delta: '+3.1%',
    icon: 'groups',
    color: AppColors.info,
  },
  {
    title: 'Products',
    value: '842',
    delta: '+1.0%',
    icon: 'inventory-2',
    color: AppColors.teal,
  },
  {
    title: 'Low Stock',
    value: '17',
    delta: '-2',
    deltaPositive: false,
    icon: 'warning-amber',
    color: AppColors.warning,
  },
  {
    title: 'Pending Orders',
    value: '54',
    delta: '+6',
    deltaPositive: false,
    icon: 'shopping-bag',
    color: AppColors.danger,
  },
  {
    title: 'Pending Repairs',
    value: '9',
    delta: '-1',
    icon: 'build',
    color: AppColors.warning,
  },
  {
    title: 'Employees',
    value: '128',
    delta: '+2',
    icon: 'badge',
    color: AppColors.primary,
  },
  // NEW STATS - matching Flutter version
  {
    title: "Today's Attendance",
    value: '118 / 128',
    delta: '92%',
    icon: 'event-available',
    color: AppColors.success,
  },
  {
    title: 'Monthly Profit',
    value: '$58,320',
    delta: '+9.7%',
    icon: 'trending-up',
    color: AppColors.teal,
  },
  {
    title: 'AI Business Insights',
    value: '5 New',
    delta: 'Updated',
    icon: 'auto-awesome',
    color: AppColors.primary,
  },
  {
    title: 'Recent Activities',
    value: '23',
    delta: 'Today',
    icon: 'history',
    color: AppColors.info,
  },
];

/* ============================================================
QUICK ACTIONS
============================================================ */

type QuickActionItem = {
  label: string;
  icon: MaterialIconsIconName;
  color: string;
};

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    label: 'Add Customer',
    icon: 'person-add-alt-1',
    color: AppColors.primary,
  },
  {
    label: 'Add Product',
    icon: 'add-box',
    color: AppColors.teal,
  },
  {
    label: 'Create Invoice',
    icon: 'receipt-long',
    color: AppColors.success,
  },
  {
    label: 'Upload Document',
    icon: 'upload-file',
    color: AppColors.info,
  },
  {
    label: 'Ask AI',
    icon: 'auto-awesome',
    color: AppColors.primary,
  },
  {
    label: 'Generate Report',
    icon: 'bar-chart',
    color: AppColors.warning,
  },
];

/* ============================================================
RECENT ACTIVITIES - NEW like Flutter
============================================================ */

type ActivityItem = {
  title: string;
  subtitle: string;
  time: string;
  icon: MaterialIconsIconName;
  color: string;
};

const ACTIVITIES: ActivityItem[] = [
  {
    title: 'Invoice #INV-2049 paid',
    subtitle: 'Customer: Ramesh Traders',
    time: '5m ago',
    icon: 'check-circle',
    color: AppColors.success,
  },
  {
    title: 'New order placed',
    subtitle: 'Order #ORD-1182 · 3 items',
    time: '22m ago',
    icon: 'shopping-bag',
    color: AppColors.primary,
  },
  {
    title: 'Low stock alert',
    subtitle: 'Product: Wireless Mouse X200',
    time: '1h ago',
    icon: 'warning-amber',
    color: AppColors.warning,
  },
  {
    title: 'Repair completed',
    subtitle: 'Ticket #RPR-0071',
    time: '2h ago',
    icon: 'build-circle',
    color: AppColors.info,
  },
  {
    title: 'AI generated monthly report',
    subtitle: 'Sales & inventory summary',
    time: '3h ago',
    icon: 'auto-awesome',
    color: AppColors.teal,
  },
];

/* ============================================================
DRAWER ITEMS
============================================================ */

export type DrawerItemDef = {
  icon: MaterialIconsIconName;
  title: string;
  screen: string;
  moduleKey?: string;
  alwaysShow?: boolean;
  adminOnly?: boolean;
};

export const DRAWER_ITEMS: DrawerItemDef[] = [
  {
    icon: 'dashboard',
    title: 'Dashboard',
    screen: 'Dashboard',
    alwaysShow: true,
  },
  {
    icon: 'auto-awesome',
    title: 'AI Assistant',
    screen: 'AiAssistant',
    moduleKey: 'AI Assistant',
  },
  {
    icon: 'people',
    title: 'Customers',
    screen: 'CustomerList',
    moduleKey: 'Customers',
  },
  {
    icon: 'inventory-2',
    title: 'Inventory',
    screen: 'Inventory',
    moduleKey: 'Inventory',
  },
  {
    icon: 'point-of-sale',
    title: 'Sales',
    screen: 'Sales',
    moduleKey: 'Sales',
  },
  {
    icon: 'shopping-cart',
    title: 'Purchase',
    screen: 'Purchase',
    moduleKey: 'Purchase',
  },
  {
    icon: 'shopping-bag',
    title: 'Orders',
    screen: 'Orders',
    moduleKey: 'Orders',
  },
  {
    icon: 'person',
    title: 'Employees',
    screen: 'EmployeeList',
    moduleKey: 'Employees',
  },
  {
    icon: 'build',
    title: 'Repairs',
    screen: 'Repairs',
    moduleKey: 'Repairs',
  },
  {
    icon: 'attach-money',
    title: 'Finance',
    screen: 'Finance',
    moduleKey: 'Finance',
  },
  {
    icon: 'bar-chart',
    title: 'Reports',
    screen: 'Reports',
    moduleKey: 'Reports',
  },
  {
    icon: 'folder',
    title: 'Document Center',
    screen: 'Documents',
    moduleKey: 'Documents',
  },
  {
    icon: 'smart-toy',
    title: 'AI Agents',
    screen: 'AiAgents',
    moduleKey: 'AI Agents',
  },
  {
    icon: 'admin-panel-settings',
    title: 'Admin',
    screen: 'Admin',
    adminOnly: true,
  },
  {
    icon: 'payments',
    title: 'Calculate Payroll',
    screen: 'PayrollCalculation',
    adminOnly: true,
  },
  {
    icon: 'receipt-long',
    title: 'Payroll',
    screen: 'PayrollView',
    adminOnly: true,
  },
  
];

/* ============================================================
FILTER DRAWER ITEMS
============================================================ */

export function getVisibleDrawerItems(
  allowedModules?: Record<string, boolean>,
): DrawerItemDef[] {
  return DRAWER_ITEMS.filter((item) => {
    if (item.alwaysShow) {
      return true;
    }

    if (!allowedModules) {
      return true;
    }

    if (item.adminOnly) {
      return false;
    }

    return allowedModules[item.moduleKey ?? ''] === true;
  });
}

/* ============================================================
DASHBOARD SCREEN
============================================================ */

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();

  const { allowedModules, employeeName } =
    (route.params as Params) ?? {};

  const visibleItems = useMemo(
    () => getVisibleDrawerItems(allowedModules),
    [allowedModules],
  );

  const isWide = SCREEN_WIDTH > 900;

  /* ============================================================
  LOGOUT
  ============================================================ */

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ],
    );
  };

  /* ============================================================
  RENDER STAT CARD - Helper
  ============================================================ */

  const renderStatCard = (item: StatItem) => (
    <View key={item.title} style={[styles.statCard, isWide && styles.statCardWide]}>
      <View style={styles.statTopRow}>
        <View
          style={[
            styles.statIconWrap,
            {
              backgroundColor: item.color + '22',
            },
          ]}
        >
          <Icon name={item.icon} size={18} color={item.color} />
        </View>

        <View
          style={[
            styles.deltaPill,
            {
              backgroundColor:
                item.deltaPositive === false
                  ? AppColors.dangerSoft
                  : AppColors.successSoft,
            },
          ]}
        >
          <Text
            style={[
              styles.deltaText,
              {
                color:
                  item.deltaPositive === false
                    ? AppColors.danger
                    : AppColors.success,
              },
            ]}
          >
            {item.delta}
          </Text>
        </View>
      </View>

      <Text style={styles.statValue}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.title}</Text>
    </View>
  );

  /* ============================================================
  RENDER ACTIVITY ITEM - NEW
  ============================================================ */

  const renderActivityItem = (item: ActivityItem, index: number) => {
    const isLast = index === ACTIVITIES.length - 1;
    return (
      <View
        key={item.title}
        style={[
          styles.activityItem,
          !isLast && styles.activityItemBorder,
        ]}
      >
        <View
          style={[
            styles.activityIconWrap,
            { backgroundColor: item.color + '18' },
          ]}
        >
          <Icon name={item.icon} size={18} color={item.color} />
        </View>

        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title}</Text>
          <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
        </View>

        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
    );
  };

  /* ============================================================
  UI
  ============================================================ */

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
<View style={[styles.header, { paddingTop: 40 }]}>  {/* ← ENTIRE HEADER MOVED DOWN 3 */}
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.iconBtn}
        >
          <Icon name="menu" size={22} color={AppColors.textSecondary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {employeeName ?? 'AI Business'}
        </Text>

        <TouchableOpacity onPress={handleLogout} style={styles.iconBtn}>
          <Icon name="logout" size={20} color={AppColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* EMPTY MODULE MESSAGE */}
      {visibleItems.length <= 1 && allowedModules && (
        <Text style={styles.emptyNote}>
          No modules assigned yet. Ask your admin for access.
        </Text>
      )}

      {/* OVERVIEW */}
      <Text style={styles.sectionTitle}>Overview</Text>

      <View style={[styles.statGrid, isWide && styles.statGridWide]}>
        {STATS.map(renderStatCard)}
      </View>

      {/* QUICK ACTIONS */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <FlatList
        horizontal
        data={QUICK_ACTIONS}
        keyExtractor={(item) => item.label}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => Alert.alert(item.label)}
          >
            <View
              style={[
                styles.statIconWrap,
                {
                  backgroundColor: item.color + '22',
                },
              ]}
            >
              <Icon name={item.icon} size={20} color={item.color} />
            </View>

            <Text style={styles.quickActionLabel}>{item.label}</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* ANALYTICS SECTION - NEW like Flutter */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
        Analytics
      </Text>

      <View style={[styles.chartsGrid, isWide && styles.chartsGridWide]}>
        {/* Sales Chart - simulated with styled view */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Sales Chart</Text>
              <Text style={styles.chartSubtitle}>Last 7 days</Text>
            </View>
            <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.salesLineChart} />
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Revenue Chart</Text>
              <Text style={styles.chartSubtitle}>Last 6 months</Text>
            </View>
            <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.revenueBarChart} />
          </View>
        </View>

        {/* Orders Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Orders Chart</Text>
              <Text style={styles.chartSubtitle}>This week</Text>
            </View>
            <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.ordersBarChart} />
          </View>
        </View>

        {/* Customer Growth */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Customer Growth</Text>
              <Text style={styles.chartSubtitle}>Last 6 months</Text>
            </View>
            <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.customerGrowthChart} />
          </View>
        </View>

        {/* Top Products */}
        <View style={[styles.chartCard, isWide && styles.chartCardWide]}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartTitle}>Top Selling Products</Text>
              <Text style={styles.chartSubtitle}>This month</Text>
            </View>
            <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
          </View>
          <View style={styles.pieChartContainer}>
            <View style={styles.pieChartPlaceholder}>
              <View style={styles.pieChart} />
            </View>
            <View style={styles.pieLegend}>
              {[
                { label: 'Electronics', color: AppColors.primary },
                { label: 'Accessories', color: AppColors.teal },
                { label: 'Home', color: AppColors.warning },
                { label: 'Other', color: AppColors.info },
              ].map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* RECENT ACTIVITIES - NEW like Flutter */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>
        Recent Activities
      </Text>

      <View style={styles.activitiesCard}>
        {ACTIVITIES.map(renderActivityItem)}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

/* ============================================================
STYLES
============================================================ */

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: AppColors.background,
  },

  contentContainer: {
    paddingBottom: 32,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },

  emptyNote: {
    textAlign: 'center',
    color: AppColors.textSecondary,
    padding: 16,
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },

  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },

  statGridWide: {
    paddingHorizontal: 32,
  },

  statCard: {
    width: '46%',
    margin: 4,
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    shadowColor: '#00000008',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 1,
  },

  statCardWide: {
    width: '22%',
  },

  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deltaPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },

  deltaText: {
    fontSize: 11,
    fontWeight: '700',
  },

  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginTop: 12,
  },

  statLabel: {
    fontSize: 12.5,
    color: AppColors.textSecondary,
    marginTop: 2,
  },

  quickList: {
    paddingVertical: 4,
    paddingLeft: 16,
  },

  quickAction: {
    width: 108,
    height: 96,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#00000008',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },

  quickActionLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },

  separator: {
    width: 0,
  },

  // Chart styles - NEW
  chartsGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },

  chartsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 32,
  },

  chartCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#00000008',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 1,
  },

  chartCardWide: {
    width: '100%',
  },

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  chartTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },

  chartSubtitle: {
    fontSize: 11.5,
    color: AppColors.textMuted,
    marginTop: 2,
  },

  chartPlaceholder: {
    height: 190,
    marginTop: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Simulated chart styles
  salesLineChart: {
    width: '100%',
    height: 160,
    backgroundColor: AppColors.primary + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.primary + '30',
    position: 'relative',
  },

  revenueBarChart: {
    width: '100%',
    height: 160,
    backgroundColor: AppColors.success + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.success + '30',
  },

  ordersBarChart: {
    width: '100%',
    height: 160,
    backgroundColor: AppColors.info + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.info + '30',
  },

  customerGrowthChart: {
    width: '100%',
    height: 160,
    backgroundColor: AppColors.teal + '15',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.teal + '30',
  },

  pieChartContainer: {
    flexDirection: 'row',
    height: 190,
    marginTop: 18,
    alignItems: 'center',
  },

  pieChartPlaceholder: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pieChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AppColors.primary + '20',
    borderWidth: 2,
    borderColor: AppColors.primary,
  },

  pieLegend: {
    flex: 3,
    paddingLeft: 12,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },

  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  legendLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },

  // Activities styles - NEW
  activitiesCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginHorizontal: 16,
    shadowColor: '#00000008',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 14,
    elevation: 1,
    overflow: 'hidden',
  },

  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },

  activityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },

  activitySubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },

  activityTime: {
    fontSize: 11.5,
    color: AppColors.textMuted,
  },
});