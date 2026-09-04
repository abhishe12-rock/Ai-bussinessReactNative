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
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import { supabase } from '../../../lib/supabase';
import { AppColors, AppRadius, AppShadows } from '../../theme/AppColors';
import {
  FadeInUp,
  FloatingGeometricOrb,
  SpringTouch,
  PulsingGlow,
} from '../../theme/Animations';

type Params = {
  allowedModules?: Record<string, boolean>;
  employeeName?: string;
  employeeId?: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ============================================================
DASHBOARD STATS - ALL ORIGINAL 12 METRICS
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
    value: '₹12,480',
    delta: '+8.2%',
    icon: 'point-of-sale',
    color: '#5B4DF8',
  },
  {
    title: 'Revenue',
    value: '₹2,48,900',
    delta: '+12.4%',
    icon: 'payments',
    color: '#10B981',
  },
  {
    title: 'Total Customers',
    value: '3,214',
    delta: '+3.1%',
    icon: 'groups',
    color: '#3B82F6',
  },
  {
    title: 'Products',
    value: '842',
    delta: '+1.0%',
    icon: 'inventory-2',
    color: '#0EA5E9',
  },
  {
    title: 'Low Stock',
    value: '17',
    delta: '-2',
    deltaPositive: false,
    icon: 'warning-amber',
    color: '#F59E0B',
  },
  {
    title: 'Pending Orders',
    value: '54',
    delta: '+6',
    deltaPositive: false,
    icon: 'shopping-bag',
    color: '#EF4444',
  },
  {
    title: 'Pending Repairs',
    value: '9',
    delta: '-1',
    icon: 'build',
    color: '#8B5CF6',
  },
  {
    title: 'Employees',
    value: '128',
    delta: '+2',
    icon: 'badge',
    color: '#6366F1',
  },
  {
    title: "Today's Attendance",
    value: '118 / 128',
    delta: '92%',
    icon: 'event-available',
    color: '#10B981',
  },
  {
    title: 'Monthly Profit',
    value: '₹58,320',
    delta: '+9.7%',
    icon: 'trending-up',
    color: '#0EA5E9',
  },
  {
    title: 'AI Business Insights',
    value: '5 New',
    delta: 'Updated',
    icon: 'auto-awesome',
    color: '#5B4DF8',
  },
  {
    title: 'Recent Activities',
    value: '23',
    delta: 'Today',
    icon: 'history',
    color: '#3B82F6',
  },
];

/* ============================================================
QUICK ACTIONS
============================================================ */

type QuickActionItem = {
  label: string;
  icon: MaterialIconsIconName;
  color: string;
  bg: string;
  screen?: string;
};

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    label: 'Add Customer',
    icon: 'person-add-alt-1',
    color: '#5B4DF8',
    bg: '#EEECFE',
    screen: 'AddCustomer',
  },
  {
    label: 'New Sale',
    icon: 'point-of-sale',
    color: '#10B981',
    bg: '#ECFDF5',
    screen: 'NewSale',
  },
  {
    label: 'Add Product',
    icon: 'add-box',
    color: '#0EA5E9',
    bg: '#F0F9FF',
    screen: 'AddProduct',
  },
  {
    label: 'New Repair',
    icon: 'build',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    screen: 'CreateRepair',
  },
  {
    label: 'Ask AI',
    icon: 'auto-awesome',
    color: '#5B4DF8',
    bg: '#EEECFE',
    screen: 'AiAssistant',
  },
  {
    label: 'Reports',
    icon: 'bar-chart',
    color: '#F59E0B',
    bg: '#FFFBEB',
    screen: 'Reports',
  },
];

/* ============================================================
RECENT ACTIVITIES
============================================================ */

type ActivityItem = {
  title: string;
  subtitle: string;
  time: string;
  icon: MaterialIconsIconName;
  color: string;
  bg: string;
};

const ACTIVITIES: ActivityItem[] = [
  {
    title: 'Invoice #INV-2049 paid',
    subtitle: 'Customer: Ramesh Traders • +₹12,450',
    time: '5m ago',
    icon: 'check-circle',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    title: 'New order placed',
    subtitle: 'Order #ORD-1182 · 3 items',
    time: '22m ago',
    icon: 'shopping-bag',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    title: 'Low stock alert',
    subtitle: 'Product: Wireless Mouse X200 · 3 left',
    time: '1h ago',
    icon: 'warning-amber',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    title: 'Repair completed',
    subtitle: 'Ticket #RPR-0071 · iPhone 13 Pro',
    time: '2h ago',
    icon: 'build-circle',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    title: 'Monthly report generated',
    subtitle: 'Sales & cash flow digest ready',
    time: '3h ago',
    icon: 'auto-awesome',
    color: '#5B4DF8',
    bg: '#EEECFE',
  },
];

/* ============================================================
DRAWER ITEMS DEF
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
  const { allowedModules, employeeName } = (route.params as Params) ?? {};

  const visibleItems = useMemo(
    () => getVisibleDrawerItems(allowedModules),
    [allowedModules],
  );

  const isWide = SCREEN_WIDTH > 900;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
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

  const renderStatCard = (item: StatItem, index: number) => (
    <FadeInUp
      key={item.title}
      delay={index * 35}
      style={[styles.statCardContainer, isWide && styles.statCardWide]}
    >
      <SpringTouch style={{ width: '100%' }}>
        <View style={styles.statCard}>
          <View style={styles.statTopRow}>
            <View
              style={[
                styles.statIconWrap,
                { backgroundColor: item.color + '18' },
              ]}
            >
              <Icon name={item.icon} size={20} color={item.color} />
            </View>

            <View
              style={[
                styles.deltaPill,
                {
                  backgroundColor:
                    item.deltaPositive === false ? '#FEF2F2' : '#ECFDF5',
                },
              ]}
            >
              <Text
                style={[
                  styles.deltaText,
                  {
                    color: item.deltaPositive === false ? '#EF4444' : '#10B981',
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
      </SpringTouch>
    </FadeInUp>
  );

  const renderActivityItem = (item: ActivityItem, index: number) => {
    const isLast = index === ACTIVITIES.length - 1;
    return (
      <FadeInUp key={item.title} delay={100 + index * 35}>
        <View
          style={[
            styles.activityItem,
            !isLast && styles.activityItemBorder,
          ]}
        >
          <View
            style={[
              styles.activityIconWrap,
              { backgroundColor: item.bg },
            ]}
          >
            <Icon name={item.icon} size={20} color={item.color} />
          </View>

          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
          </View>

          <Text style={styles.activityTime}>{item.time}</Text>
        </View>
      </FadeInUp>
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <Icon name="menu" size={22} color={AppColors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {employeeName ?? 'AI Business Hub'}
          </Text>
          <View style={styles.liveIndicator}>
            <PulsingGlow size={6} glowRadius={14} color="#10B981" />
            <Text style={styles.liveText}>SYSTEM LIVE</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <Icon name="logout" size={20} color={AppColors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* HERO CARD: ROYAL PURPLE GRADIENT */}
      <FadeInUp delay={60} duration={550} distance={14}>
        <View style={styles.heroCard}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
            <Defs>
              <SvgLinearGradient id="dashHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#5B4DF8" />
                <Stop offset="100%" stopColor="#7C3AED" />
              </SvgLinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#dashHeroGrad)" />
          </Svg>

          {/* Continuous Floating Geometric Orbs */}
          <FloatingGeometricOrb
            size={130}
            top={-30}
            right={-25}
            color="rgba(255, 255, 255, 0.12)"
            duration={4200}
            floatDistance={10}
          />
          <FloatingGeometricOrb
            size={85}
            bottom={-30}
            right={65}
            color="rgba(255, 255, 255, 0.08)"
            duration={5200}
            floatDistance={8}
          />

          <View style={styles.heroInner}>
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <PulsingGlow size={6} glowRadius={12} color="#FFFFFF" />
                <Text style={styles.heroBadgeText}>AI ENGINE ACTIVE</Text>
              </View>
            </View>

            <Text style={styles.heroGreeting}>
              {employeeName ? `Welcome back, ${employeeName}` : 'Welcome, Business Hub'} 👋
            </Text>
            <Text style={styles.heroSubtitle}>
              Sales trending +12.4% over previous cycle. All systems autonomous and live today.
            </Text>
          </View>
        </View>
      </FadeInUp>

      {/* EMPTY MODULE MESSAGE */}
      {visibleItems.length <= 1 && allowedModules && (
        <Text style={styles.emptyNote}>
          No modules assigned yet. Ask your admin for access.
        </Text>
      )}

      {/* OVERVIEW & METRICS */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Overview & Metrics</Text>
        <Text style={styles.sectionMeta}>Updated live</Text>
      </View>

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
        renderItem={({ item, index }) => (
          <FadeInUp delay={80 + index * 40} style={styles.quickActionOuter}>
            <SpringTouch
              onPress={() => {
                if (item.screen) {
                  navigation.navigate(item.screen);
                } else {
                  Alert.alert(item.label);
                }
              }}
            >
              <View style={styles.quickAction}>
                <View
                  style={[
                    styles.quickIconWrap,
                    { backgroundColor: item.bg },
                  ]}
                >
                  <Icon name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={styles.quickActionLabel}>{item.label}</Text>
              </View>
            </SpringTouch>
          </FadeInUp>
        )}
      />

      {/* ANALYTICS SECTION */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Analytics</Text>

      <View style={[styles.chartsGrid, isWide && styles.chartsGridWide]}>
        {/* Sales Trend Chart */}
        <FadeInUp delay={100} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Sales Trend</Text>
                <Text style={styles.chartSubtitle}>Last 7 days performance</Text>
              </View>
              <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
            </View>
            <View style={styles.chartPlaceholder}>
              <View style={styles.salesLineChart} />
            </View>
          </View>
        </FadeInUp>

        {/* Revenue Dynamics Chart */}
        <FadeInUp delay={140} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Revenue Dynamics</Text>
                <Text style={styles.chartSubtitle}>Last 6 months comparison</Text>
              </View>
              <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
            </View>
            <View style={styles.chartPlaceholder}>
              <View style={styles.revenueBarChart} />
            </View>
          </View>
        </FadeInUp>

        {/* Order Volume */}
        <FadeInUp delay={180} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Order Volume</Text>
                <Text style={styles.chartSubtitle}>Current active cycle</Text>
              </View>
              <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
            </View>
            <View style={styles.chartPlaceholder}>
              <View style={styles.ordersBarChart} />
            </View>
          </View>
        </FadeInUp>

        {/* Client Acquisition */}
        <FadeInUp delay={220} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Client Acquisition</Text>
                <Text style={styles.chartSubtitle}>Quarterly growth trajectory</Text>
              </View>
              <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
            </View>
            <View style={styles.chartPlaceholder}>
              <View style={styles.customerGrowthChart} />
            </View>
          </View>
        </FadeInUp>

        {/* Top Products */}
        <FadeInUp delay={260} style={{ width: '100%' }}>
          <View style={[styles.chartCard, isWide && styles.chartCardWide]}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Top Performing Categories</Text>
                <Text style={styles.chartSubtitle}>Share by revenue</Text>
              </View>
              <Icon name="more-horiz" size={20} color={AppColors.textMuted} />
            </View>
            <View style={styles.pieChartContainer}>
              <View style={styles.pieChartPlaceholder}>
                <View style={styles.pieChart} />
              </View>
              <View style={styles.pieLegend}>
                {[
                  { label: 'Electronics', color: '#5B4DF8' },
                  { label: 'Accessories', color: '#0EA5E9' },
                  { label: 'Home & Office', color: '#F59E0B' },
                  { label: 'Services', color: '#10B981' },
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
        </FadeInUp>
      </View>

      {/* RECENT ACTIVITIES */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Activities</Text>

      <FadeInUp delay={200}>
        <View style={styles.activitiesCard}>
          {ACTIVITIES.map(renderActivityItem)}
        </View>
      </FadeInUp>

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

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.4,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.6,
  },

  /* HERO CARD */
  heroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    padding: 20,
    backgroundColor: '#5B4DF8',
    ...AppShadows.glow,
  },
  heroDecoCircle1: {
    position: 'absolute',
    right: -25,
    top: -25,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroDecoCircle2: {
    position: 'absolute',
    right: 60,
    bottom: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroInner: {
    position: 'relative',
    zIndex: 2,
  },
  heroBadgeRow: {
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    fontWeight: '500',
  },

  emptyNote: {
    textAlign: 'center',
    color: AppColors.textSecondary,
    padding: 16,
    fontSize: 13,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  sectionMeta: {
    fontSize: 11,
    color: AppColors.textMuted,
    fontWeight: '600',
  },

  /* STATS GRID */
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 10,
  },
  statGridWide: {
    paddingHorizontal: 32,
  },
  statCardContainer: {
    width: (SCREEN_WIDTH - 44) / 2,
    margin: 6,
  },
  statCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    ...AppShadows.subtle,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaPill: {
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 10,
  },
  deltaText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.4,
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginTop: 2,
  },

  /* QUICK ACTIONS */
  quickList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  quickActionOuter: {
    marginRight: 10,
  },
  quickAction: {
    width: 104,
    height: 92,
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...AppShadows.subtle,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginTop: 6,
    textAlign: 'center',
  },

  /* CHARTS */
  chartsGrid: {
    paddingHorizontal: 16,
    gap: 12,
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
    padding: 16,
    marginBottom: 12,
    ...AppShadows.card,
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
    letterSpacing: -0.2,
  },
  chartSubtitle: {
    fontSize: 11.5,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  chartPlaceholder: {
    height: 140,
    marginTop: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  salesLineChart: {
    width: '100%',
    height: 130,
    backgroundColor: '#EEECFE',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#5B4DF830',
  },
  revenueBarChart: {
    width: '100%',
    height: 130,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  ordersBarChart: {
    width: '100%',
    height: 130,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F630',
  },
  customerGrowthChart: {
    width: '100%',
    height: 130,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0EA5E930',
  },
  pieChartContainer: {
    flexDirection: 'row',
    height: 140,
    marginTop: 14,
    alignItems: 'center',
  },
  pieChartPlaceholder: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieChart: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEECFE',
    borderWidth: 3,
    borderColor: '#5B4DF8',
  },
  pieLegend: {
    flex: 4,
    paddingLeft: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3.5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },

  /* ACTIVITIES */
  activitiesCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginHorizontal: 16,
    ...AppShadows.card,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  activityIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  activitySubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
});