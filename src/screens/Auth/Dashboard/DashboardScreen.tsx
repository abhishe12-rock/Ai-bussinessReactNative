import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
  DrawerActions,
} from '@react-navigation/native';
import Icon, {
  type MaterialIconsIconName,
} from '@react-native-vector-icons/material-icons';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Circle,
  G,
  Path,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { supabase } from '../../../lib/supabase';
import { EmployeeService } from '../../../services/EmployeeService';
import { FinanceService } from '../../../services/FinanceService';
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
SVG AREA / LINE CHART COMPONENT (MATCHING USER IMAGE SPEC)
============================================================ */

type LineChartPoint = {
  label: string; // e.g. "20", "21", "22", "23"
  value: number; // real database sales total
  isToday?: boolean;
};

function SvgAreaLineChart({
  data,
  height = 180,
  lineColor = '#3B82F6',
  dotColor = '#3B82F6',
}: {
  data: LineChartPoint[];
  height?: number;
  lineColor?: string;
  dotColor?: string;
}) {
  const [layoutWidth, setLayoutWidth] = useState<number>(SCREEN_WIDTH - 64);

  const paddingLeft = 38;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 28;

  const width = Math.max(layoutWidth, 240);
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const rawMax = Math.max(...(data.length > 0 ? data.map((d) => d.value) : [0]), 0);
  
  // Calculate round max for nice y-axis tick steps (0, 65, 130, 250 style)
  let maxVal = rawMax > 0 ? rawMax : 250;
  if (maxVal <= 50) maxVal = 50;
  else if (maxVal <= 100) maxVal = 100;
  else if (maxVal <= 250) maxVal = 250;
  else if (maxVal <= 500) maxVal = 500;
  else if (maxVal <= 1000) maxVal = 1000;
  else if (maxVal <= 5000) maxVal = 5000;
  else if (maxVal <= 10000) maxVal = 10000;
  else if (maxVal <= 50000) maxVal = 50000;
  else maxVal = Math.ceil(maxVal / 10000) * 10000;

  const n = data.length;
  const points = data.map((d, i) => {
    const x = paddingLeft + (n > 1 ? (i / (n - 1)) * plotWidth : plotWidth / 2);
    const yRatio = maxVal > 0 ? d.value / maxVal : 0;
    const y = paddingTop + plotHeight - yRatio * plotHeight;
    return { x, y, value: d.value, label: d.label, isToday: d.isToday };
  });

  // Build line & area path
  const linePath = points.length > 0
    ? points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '')
    : '';

  const baseY = paddingTop + plotHeight;
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`
    : '';

  // 4 Y-ticks (e.g. 250, 130, 65, 0)
  const yTicks = [
    { val: maxVal, y: paddingTop },
    { val: Math.round(maxVal * 0.66), y: paddingTop + plotHeight * 0.34 },
    { val: Math.round(maxVal * 0.33), y: paddingTop + plotHeight * 0.67 },
    { val: 0, y: baseY },
  ];

  return (
    <View
      style={{ width: '100%', height }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 50) setLayoutWidth(w);
      }}
    >
      <Svg width={width} height={height}>
        <Defs>
          <SvgLinearGradient id="blueAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
            <Stop offset="85%" stopColor="#93C5FD" stopOpacity={0.06} />
            <Stop offset="100%" stopColor="#93C5FD" stopOpacity={0.0} />
          </SvgLinearGradient>
        </Defs>

        {/* Horizontal grid lines & Y-axis labels */}
        {yTicks.map((tick, idx) => (
          <G key={`tick-${idx}`}>
            <Line
              x1={paddingLeft}
              x2={width - paddingRight}
              y1={tick.y}
              y2={tick.y}
              stroke="#F1F5F9"
              strokeWidth={1}
            />
            <SvgText
              x={paddingLeft - 8}
              y={tick.y + 3.5}
              fontSize={9}
              fontWeight="600"
              fill="#94A3B8"
              textAnchor="end"
            >
              {tick.val >= 1000 ? `${(tick.val / 1000).toFixed(0)}k` : tick.val}
            </SvgText>
          </G>
        ))}

        {/* Area Gradient Shading */}
        {areaPath ? <Path d={areaPath} fill="url(#blueAreaGrad)" /> : null}

        {/* Smooth Connecting Line */}
        {linePath ? (
          <Path
            d={linePath}
            stroke={lineColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Blue Circular Data Nodes & X-axis Dates */}
        {points.map((pt, idx) => (
          <G key={`point-${idx}`}>
            {/* Circular Node */}
            <Circle
              cx={pt.x}
              cy={pt.y}
              r={5}
              fill={dotColor}
              stroke="#FFFFFF"
              strokeWidth={2}
            />
            {/* X-axis date number label (e.g. 20, 21, 22, 23, 24, 25, 26) */}
            <SvgText
              x={pt.x}
              y={height - 6}
              fontSize={10}
              fontWeight="600"
              fill={pt.isToday ? lineColor : '#94A3B8'}
              textAnchor="middle"
            >
              {pt.label}
            </SvgText>
          </G>
        ))}
      </Svg>
    </View>
  );
}

/* ============================================================
PIE / DONUT CHART DATA TYPE & COMPONENT
============================================================ */

type PieChartDataPoint = {
  label: string;
  value: number;
  color: string;
  percent: number;
  formattedValue?: string;
};

function SvgDonutChart({
  data,
  size = 120,
  strokeWidth = 14,
  centerValue,
  centerLabel,
}: {
  data: PieChartDataPoint[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string;
  centerLabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((acc, d) => acc + (d.value || 0), 0);

  let accumulatedPercent = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* Background Ring */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={AppColors.surfaceSoft}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {total > 0 &&
            data.map((item, index) => {
              if (item.percent <= 0) return null;
              const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percent;

              return (
                <Circle
                  key={`${item.label}-${index}`}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  fill="transparent"
                  strokeLinecap="butt"
                />
              );
            })}
        </G>
      </Svg>
      {centerValue && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '800',
                color: AppColors.textPrimary,
                textAlign: 'center',
              }}
              numberOfLines={1}
            >
              {centerValue}
            </Text>
            {centerLabel && (
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: '700',
                  color: AppColors.textMuted,
                  marginTop: -1,
                  textAlign: 'center',
                }}
              >
                {centerLabel}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/* ============================================================
DASHBOARD STAT ITEM TYPE
============================================================ */

type StatItem = {
  title: string;
  value: string;
  delta: string;
  icon: MaterialIconsIconName;
  color: string;
  deltaPositive?: boolean;
  drawerScreen?: string;
  nestedScreen?: string;
};

const INITIAL_STATS: StatItem[] = [
  {
    title: "Today's Sales",
    value: '₹0',
    delta: '+0%',
    deltaPositive: true,
    icon: 'point-of-sale',
    color: '#5B4DF8',
    drawerScreen: 'Sales',
    nestedScreen: 'SalesHistory',
  },
  {
    title: 'Total Revenue',
    value: '₹0',
    delta: '+0%',
    deltaPositive: true,
    icon: 'payments',
    color: '#10B981',
    drawerScreen: 'Sales',
    nestedScreen: 'Invoices',
  },
  {
    title: 'Total Customers',
    value: '0',
    delta: '+0%',
    deltaPositive: true,
    icon: 'groups',
    color: '#3B82F6',
    drawerScreen: 'CustomerList',
    nestedScreen: 'CustomerListHome',
  },
  {
    title: 'Products',
    value: '0',
    delta: '0 low',
    deltaPositive: true,
    icon: 'inventory-2',
    color: '#0EA5E9',
    drawerScreen: 'Inventory',
    nestedScreen: 'Products',
  },
  {
    title: 'Low Stock',
    value: '0',
    delta: 'Optimal',
    deltaPositive: true,
    icon: 'warning-amber',
    color: '#F59E0B',
    drawerScreen: 'Inventory',
    nestedScreen: 'LowStockAlert',
  },
  {
    title: 'Pending Orders',
    value: '0',
    delta: 'Clear',
    deltaPositive: true,
    icon: 'shopping-bag',
    color: '#EF4444',
    drawerScreen: 'Orders',
    nestedScreen: 'OrdersHome',
  },
  {
    title: 'Pending Repairs',
    value: '0',
    delta: 'All Done',
    deltaPositive: true,
    icon: 'build',
    color: '#8B5CF6',
    drawerScreen: 'Repairs',
    nestedScreen: 'RepairsHome',
  },
  {
    title: 'Employees',
    value: '0',
    delta: 'Active',
    deltaPositive: true,
    icon: 'badge',
    color: '#6366F1',
    drawerScreen: 'EmployeeList',
    nestedScreen: 'EmployeeListHome',
  },
  {
    title: "Today's Attendance",
    value: '0 / 0',
    delta: '100%',
    deltaPositive: true,
    icon: 'event-available',
    color: '#10B981',
    drawerScreen: 'EmployeeList',
    nestedScreen: 'Attendance',
  },
  {
    title: 'Monthly Profit',
    value: '₹0',
    delta: '+Healthy',
    deltaPositive: true,
    icon: 'trending-up',
    color: '#0EA5E9',
    drawerScreen: 'Finance',
    nestedScreen: 'FinanceHome',
  },
  {
    title: 'AI Business Insights',
    value: '0 Active',
    delta: 'Live Sync',
    deltaPositive: true,
    icon: 'auto-awesome',
    color: '#5B4DF8',
    drawerScreen: 'AiInsights',
  },
  {
    title: 'Recent Activities',
    value: '0',
    delta: 'Today',
    deltaPositive: true,
    icon: 'history',
    color: '#3B82F6',
    drawerScreen: 'Sales',
    nestedScreen: 'SalesHistory',
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
  drawerScreen: string;
  nestedScreen?: string;
};

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    label: 'Add Customer',
    icon: 'person-add-alt-1',
    color: '#5B4DF8',
    bg: '#EEECFE',
    drawerScreen: 'CustomerList',
    nestedScreen: 'AddCustomer',
  },
  {
    label: 'New Sale',
    icon: 'point-of-sale',
    color: '#10B981',
    bg: '#ECFDF5',
    drawerScreen: 'Sales',
    nestedScreen: 'NewSale',
  },
  {
    label: 'Add Product',
    icon: 'add-box',
    color: '#0EA5E9',
    bg: '#F0F9FF',
    drawerScreen: 'Inventory',
    nestedScreen: 'AddProduct',
  },
  {
    label: 'New Repair',
    icon: 'build',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    drawerScreen: 'Repairs',
    nestedScreen: 'CreateRepair',
  },
  {
    label: 'Ask AI',
    icon: 'auto-awesome',
    color: '#5B4DF8',
    bg: '#EEECFE',
    drawerScreen: 'AiAssistant',
  },
  {
    label: 'Reports',
    icon: 'bar-chart',
    color: '#F59E0B',
    bg: '#FFFBEB',
    drawerScreen: 'Reports',
  },
];

/* ============================================================
RECENT ACTIVITIES TYPE
============================================================ */

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon: MaterialIconsIconName;
  color: string;
  bg: string;
  timestamp: number;
  drawerScreen?: string;
  nestedScreen?: string;
};

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
    icon: 'lightbulb-outline',
    title: 'AI Insights',
    screen: 'AiInsights',
    moduleKey: 'AI Insights',
  },
  {
    icon: 'build',
    title: 'MCP Tools',
    screen: 'McpTools',
    moduleKey: 'MCP Tools',
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
HELPER: Format Time Difference
============================================================ */

function formatTimeAgo(dateInput?: Date | string | number | null): string {
  if (!dateInput) return 'Recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Recently';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ============================================================
DASHBOARD SCREEN COMPONENT
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

  // Live State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Metrics State with robust default
  const [stats, setStats] = useState<StatItem[]>(INITIAL_STATS);
  const [heroSummary, setHeroSummary] = useState({
    titleDelta: '+0%',
    subtitle: 'All business systems autonomous and live.',
  });

  // Analytics Visual State
  const [salesTrend, setSalesTrend] = useState<LineChartPoint[]>([]);
  const [financeRatio, setFinanceRatio] = useState({ income: 0, expenses: 0, net: 0 });
  const [orderMetrics, setOrderMetrics] = useState({ pending: 0, completed: 0, total: 0 });
  const [categoryBreakdown, setCategoryBreakdown] = useState<PieChartDataPoint[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PieChartDataPoint[]>([]);
  const [stockHealthBreakdown, setStockHealthBreakdown] = useState<PieChartDataPoint[]>([]);
  const [customerMetrics, setCustomerMetrics] = useState({ total: 0, newThisMonth: 0, growthPercent: '+0%' });
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  /* Robust navigation router supporting top-level drawer and nested stack screens */
  const navigateTo = useCallback(
    (drawerScreen?: string, nestedScreen?: string) => {
      if (!drawerScreen) return;
      try {
        if (nestedScreen) {
          navigation.navigate(drawerScreen, { screen: nestedScreen });
        } else {
          navigation.navigate(drawerScreen);
        }
      } catch (err) {
        console.warn(`Navigation error targeting ${drawerScreen} -> ${nestedScreen}:`, err);
        navigation.navigate(drawerScreen);
      }
    },
    [navigation]
  );

  /* ============================================================
  FETCH LIVE DASHBOARD DATA FROM SUPABASE SAFELY
  ============================================================ */
  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      let ownerId: string | null = null;
      try {
        ownerId = await EmployeeService.resolveDataOwnerId(supabase);
      } catch {
        const { data: sessionData } = await supabase.auth.getSession();
        ownerId = sessionData.session?.user?.id ?? null;
      }

      const now = new Date();

      // Today range
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const todayDateStr = now.toISOString().split('T')[0];

      // Yesterday range
      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(yesterdayStart.getDate() - 1);
      const yesterdayEnd = new Date(todayEnd);
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

      // This Month start
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

      // Parallel Data Fetching with allSettled for rock-solid fault tolerance
      const [
        salesSettled,
        productsSettled,
        customersSettled,
        repairsSettled,
        ordersSettled,
        purchasesSettled,
        employeesSettled,
        attendanceSettled,
        financeSettled,
        categoriesSettled,
      ] = await Promise.allSettled([
        // 1. Sales
        ownerId
          ? supabase
              .from('sales')
              .select('id, invoice_number, total, paid_amount, payment_status, payment_method, created_at, customer_id, customers(name)')
              .eq('user_id', ownerId)
              .order('created_at', { ascending: false })
              .limit(300)
          : supabase
              .from('sales')
              .select('id, invoice_number, total, paid_amount, payment_status, payment_method, created_at, customer_id, customers(name)')
              .order('created_at', { ascending: false })
              .limit(300),

        // 2. Products
        ownerId
          ? supabase
              .from('products')
              .select('id, name, quantity, minimum_stock, selling_price, category_id, categories(name)')
              .eq('user_id', ownerId)
              .order('created_at', { ascending: false })
          : supabase
              .from('products')
              .select('id, name, quantity, minimum_stock, selling_price, category_id, categories(name)')
              .order('created_at', { ascending: false }),

        // 3. Customers
        ownerId
          ? supabase
              .from('customers')
              .select('id, name, phone, created_at')
              .eq('user_id', ownerId)
              .order('created_at', { ascending: false })
          : supabase
              .from('customers')
              .select('id, name, phone, created_at')
              .order('created_at', { ascending: false }),

        // 4. Repairs
        ownerId
          ? supabase
              .from('repairs')
              .select('id, ticket_number, customer_name, device_brand, device_model, issue, status, cost, estimated_cost, created_at')
              .eq('owner_id', ownerId)
              .order('created_at', { ascending: false })
              .limit(100)
          : supabase
              .from('repairs')
              .select('id, ticket_number, customer_name, device_brand, device_model, issue, status, cost, estimated_cost, created_at')
              .order('created_at', { ascending: false })
              .limit(100),

        // 5. Orders
        ownerId
          ? supabase
              .from('orders')
              .select('id, order_number, total, paid_amount, status, created_at')
              .eq('user_id', ownerId)
              .order('created_at', { ascending: false })
              .limit(100)
          : supabase
              .from('orders')
              .select('id, order_number, total, paid_amount, status, created_at')
              .order('created_at', { ascending: false })
              .limit(100),

        // 6. Purchases
        ownerId
          ? supabase
              .from('purchases')
              .select('id, invoice_no, total_amount, paid_amount, status, created_at')
              .eq('user_id', ownerId)
              .order('created_at', { ascending: false })
              .limit(50)
          : supabase
              .from('purchases')
              .select('id, invoice_no, total_amount, paid_amount, status, created_at')
              .order('created_at', { ascending: false })
              .limit(50),

        // 7. Employees
        ownerId
          ? supabase
              .from('employees')
              .select('id, full_name, status')
              .eq('owner_id', ownerId)
          : supabase
              .from('employees')
              .select('id, full_name, status'),

        // 8. Today's Attendance
        supabase
          .from('attendance')
          .select('id, status, employee_id, attendance_date')
          .eq('attendance_date', todayDateStr),

        // 9. Finance Month Summary
        FinanceService.getMonthSummary(),

        // 10. Categories
        ownerId
          ? supabase
              .from('categories')
              .select('id, name')
              .eq('user_id', ownerId)
          : supabase
              .from('categories')
              .select('id, name'),
      ]);

      const sales = (salesSettled.status === 'fulfilled' && (salesSettled.value as any)?.data) ? (salesSettled.value as any).data : [];
      const products = (productsSettled.status === 'fulfilled' && (productsSettled.value as any)?.data) ? (productsSettled.value as any).data : [];
      const customers = (customersSettled.status === 'fulfilled' && (customersSettled.value as any)?.data) ? (customersSettled.value as any).data : [];
      const repairs = (repairsSettled.status === 'fulfilled' && (repairsSettled.value as any)?.data) ? (repairsSettled.value as any).data : [];
      const orders = (ordersSettled.status === 'fulfilled' && (ordersSettled.value as any)?.data) ? (ordersSettled.value as any).data : [];
      const purchases = (purchasesSettled.status === 'fulfilled' && (purchasesSettled.value as any)?.data) ? (purchasesSettled.value as any).data : [];
      const employees = (employeesSettled.status === 'fulfilled' && (employeesSettled.value as any)?.data) ? (employeesSettled.value as any).data : [];
      const attendance = (attendanceSettled.status === 'fulfilled' && (attendanceSettled.value as any)?.data) ? (attendanceSettled.value as any).data : [];
      const financeSummary = (financeSettled.status === 'fulfilled' && financeSettled.value) ? financeSettled.value : { income: 0, expenses: 0, net: 0 };
      const categories = (categoriesSettled.status === 'fulfilled' && (categoriesSettled.value as any)?.data) ? (categoriesSettled.value as any).data : [];

      // -------------------------------------------------------------
      // 1. CALCULATE CORE METRICS
      // -------------------------------------------------------------
      // Today's Sales
      const todaySalesList = sales.filter((s: any) => {
        const d = new Date(s.created_at);
        return d >= todayStart && d <= todayEnd;
      });
      const todaySalesTotal = todaySalesList.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0);

      // Yesterday's Sales
      const yesterdaySalesList = sales.filter((s: any) => {
        const d = new Date(s.created_at);
        return d >= yesterdayStart && d <= yesterdayEnd;
      });
      const yesterdaySalesTotal = yesterdaySalesList.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0);

      let todaySalesDeltaStr = '+0%';
      let todaySalesDeltaPos = true;
      if (yesterdaySalesTotal > 0) {
        const diffPercent = ((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100;
        todaySalesDeltaPos = diffPercent >= 0;
        todaySalesDeltaStr = `${todaySalesDeltaPos ? '+' : ''}${diffPercent.toFixed(1)}%`;
      } else if (todaySalesTotal > 0) {
        todaySalesDeltaStr = '+100%';
        todaySalesDeltaPos = true;
      }

      // Total Revenue
      const grossRevenue = sales.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0);
      const totalIncome = financeSummary.income > 0 ? financeSummary.income : grossRevenue;
      const totalExpenses = financeSummary.expenses;
      const netProfit = financeSummary.net !== 0 ? financeSummary.net : (grossRevenue - totalExpenses);

      // Total Customers & Growth
      const totalCustomersCount = customers.length;
      const newCustomersThisMonth = customers.filter((c: any) => new Date(c.created_at) >= monthStart).length;
      const customerGrowthStr = totalCustomersCount > 0
        ? `+${((newCustomersThisMonth / Math.max(1, totalCustomersCount)) * 100).toFixed(1)}%`
        : '+0%';

      // Products & Low Stock
      const totalProductsCount = products.length;
      const inStockProducts = products.filter((p: any) => Number(p.quantity || 0) > Number(p.minimum_stock ?? 5));
      const lowStockProducts = products.filter(
        (p: any) => Number(p.quantity || 0) > 0 && Number(p.quantity || 0) <= Number(p.minimum_stock ?? 5)
      );
      const outOfStockProducts = products.filter((p: any) => Number(p.quantity || 0) <= 0);
      const lowStockCount = lowStockProducts.length;

      // Pending Orders
      const pendingOrders = orders.filter(
        (o: any) => o.status === 'PENDING' || o.status === 'PROCESSING' || o.status === 'Draft'
      );
      const pendingPurchases = purchases.filter(
        (p: any) => p.status === 'Pending' || p.status === 'Partially Received'
      );
      const pendingOrdersCount = pendingOrders.length + pendingPurchases.length;

      // Pending Repairs
      const activeRepairs = repairs.filter(
        (r: any) => r.status !== 'COMPLETED' && r.status !== 'DELIVERED' && r.status !== 'CANCELLED'
      );
      const pendingRepairsCount = activeRepairs.length;

      // Employees & Attendance
      const activeEmployees = employees.filter((e: any) => e.status !== 'INACTIVE');
      const totalEmployeesCount = activeEmployees.length;
      const presentTodayCount = attendance.filter(
        (a: any) => a.status === 'PRESENT' || a.status === 'LATE'
      ).length;
      const attendancePercentStr = totalEmployeesCount > 0
        ? `${Math.round((presentTodayCount / totalEmployeesCount) * 100)}%`
        : '100%';

      // AI Business Insights count
      const activeInsightsCount = (lowStockCount > 0 ? 1 : 0) +
        (pendingRepairsCount > 0 ? 1 : 0) +
        (pendingOrdersCount > 0 ? 1 : 0) +
        (todaySalesTotal > 0 ? 1 : 0) + 1;

      // Today's Activity Count
      const recentActivitiesToday = salesListActivities(sales, repairs, lowStockProducts, purchases, orders);
      const todayActivitiesCount = recentActivitiesToday.filter(
        (a) => a.timestamp >= todayStart.getTime()
      ).length;

      // Build 12 Interactive Metric Cards with Direct Screen Linking
      const newStats: StatItem[] = [
        {
          title: "Today's Sales",
          value: `₹${todaySalesTotal.toLocaleString('en-IN')}`,
          delta: todaySalesDeltaStr,
          deltaPositive: todaySalesDeltaPos,
          icon: 'point-of-sale',
          color: '#5B4DF8',
          drawerScreen: 'Sales',
          nestedScreen: 'SalesHistory',
        },
        {
          title: 'Total Revenue',
          value: `₹${grossRevenue.toLocaleString('en-IN')}`,
          delta: todaySalesDeltaStr,
          deltaPositive: todaySalesDeltaPos,
          icon: 'payments',
          color: '#10B981',
          drawerScreen: 'Sales',
          nestedScreen: 'Invoices',
        },
        {
          title: 'Total Customers',
          value: `${totalCustomersCount.toLocaleString('en-IN')}`,
          delta: customerGrowthStr,
          deltaPositive: true,
          icon: 'groups',
          color: '#3B82F6',
          drawerScreen: 'CustomerList',
          nestedScreen: 'CustomerListHome',
        },
        {
          title: 'Products',
          value: `${totalProductsCount.toLocaleString('en-IN')}`,
          delta: `${lowStockCount} low`,
          deltaPositive: lowStockCount === 0,
          icon: 'inventory-2',
          color: '#0EA5E9',
          drawerScreen: 'Inventory',
          nestedScreen: 'Products',
        },
        {
          title: 'Low Stock',
          value: `${lowStockCount}`,
          delta: lowStockCount > 0 ? 'Action required' : 'Optimal',
          deltaPositive: lowStockCount === 0,
          icon: 'warning-amber',
          color: '#F59E0B',
          drawerScreen: 'Inventory',
          nestedScreen: 'LowStockAlert',
        },
        {
          title: 'Pending Orders',
          value: `${pendingOrdersCount}`,
          delta: pendingOrdersCount > 0 ? `${pendingOrdersCount} open` : 'Clear',
          deltaPositive: pendingOrdersCount === 0,
          icon: 'shopping-bag',
          color: '#EF4444',
          drawerScreen: 'Orders',
          nestedScreen: 'OrdersHome',
        },
        {
          title: 'Pending Repairs',
          value: `${pendingRepairsCount}`,
          delta: pendingRepairsCount > 0 ? `${pendingRepairsCount} active` : 'All Done',
          deltaPositive: pendingRepairsCount === 0,
          icon: 'build',
          color: '#8B5CF6',
          drawerScreen: 'Repairs',
          nestedScreen: 'RepairsHome',
        },
        {
          title: 'Employees',
          value: `${totalEmployeesCount}`,
          delta: 'Active',
          deltaPositive: true,
          icon: 'badge',
          color: '#6366F1',
          drawerScreen: 'EmployeeList',
          nestedScreen: 'EmployeeListHome',
        },
        {
          title: "Today's Attendance",
          value: totalEmployeesCount > 0 ? `${presentTodayCount} / ${totalEmployeesCount}` : '—',
          delta: attendancePercentStr,
          deltaPositive: presentTodayCount >= totalEmployeesCount,
          icon: 'event-available',
          color: '#10B981',
          drawerScreen: 'EmployeeList',
          nestedScreen: 'Attendance',
        },
        {
          title: 'Monthly Profit',
          value: `₹${netProfit.toLocaleString('en-IN')}`,
          delta: netProfit >= 0 ? '+Healthy' : '-Deficit',
          deltaPositive: netProfit >= 0,
          icon: 'trending-up',
          color: '#0EA5E9',
          drawerScreen: 'Finance',
          nestedScreen: 'FinanceHome',
        },
        {
          title: 'AI Business Insights',
          value: `${activeInsightsCount} Active`,
          delta: 'Live Sync',
          deltaPositive: true,
          icon: 'auto-awesome',
          color: '#5B4DF8',
          drawerScreen: 'AiInsights',
        },
        {
          title: 'Recent Activities',
          value: `${Math.max(todayActivitiesCount, recentActivitiesToday.length)}`,
          delta: 'Today',
          deltaPositive: true,
          icon: 'history',
          color: '#3B82F6',
          drawerScreen: 'Sales',
          nestedScreen: 'SalesHistory',
        },
      ];

      setStats(newStats);

      // Hero banner state
      setHeroSummary({
        titleDelta: todaySalesDeltaStr,
        subtitle: `Sales today: ₹${todaySalesTotal.toLocaleString('en-IN')} across ${todaySalesList.length} orders. All business systems autonomous and live.`,
      });

      // -------------------------------------------------------------
      // 2. COMPUTE 7-DAY SALES TREND (WITH DAY DATES FOR GRAPH)
      // -------------------------------------------------------------
      const trendData: LineChartPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now);
        targetDate.setDate(targetDate.getDate() - i);
        const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
        const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

        const daySales = sales.filter((s: any) => {
          const d = new Date(s.created_at);
          return d >= dayStart && d <= dayEnd;
        });
        const sum = daySales.reduce((acc: number, s: any) => acc + (Number(s.total) || 0), 0);

        trendData.push({
          label: `${targetDate.getDate()}`,
          value: sum,
          isToday: i === 0,
        });
      }
      setSalesTrend(trendData);

      // -------------------------------------------------------------
      // 3. FINANCE RATIO & ORDERS BREAKDOWN
      // -------------------------------------------------------------
      setFinanceRatio({
        income: Math.max(totalIncome, 1),
        expenses: totalExpenses,
        net: netProfit,
      });

      const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED' || o.status === 'DELIVERED').length;
      setOrderMetrics({
        pending: pendingOrdersCount,
        completed: completedOrders,
        total: Math.max(orders.length + purchases.length, 1),
      });

      setCustomerMetrics({
        total: totalCustomersCount,
        newThisMonth: newCustomersThisMonth,
        growthPercent: customerGrowthStr,
      });

      // -------------------------------------------------------------
      // 4. TOP PERFORMING CATEGORIES PIE CHART DATA
      // -------------------------------------------------------------
      const categoryColorPalette = ['#5B4DF8', '#0EA5E9', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
      const catCountMap: Record<string, number> = {};
      products.forEach((p: any) => {
        const catName = Array.isArray(p.categories) ? p.categories[0]?.name : p.categories?.name || 'General';
        catCountMap[catName] = (catCountMap[catName] || 0) + 1;
      });

      const catKeys = Object.keys(catCountMap);
      if (catKeys.length === 0 && categories.length > 0) {
        categories.forEach((c: any) => {
          catCountMap[c.name] = 1;
        });
      }

      const totalProductItems = Math.max(products.length, 1);
      const catList: PieChartDataPoint[] = Object.entries(catCountMap)
        .map(([name, count], idx) => ({
          label: name,
          value: count,
          percent: Math.round((count / totalProductItems) * 100),
          color: categoryColorPalette[idx % categoryColorPalette.length],
          formattedValue: `${count} items`,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 4);

      if (catList.length === 0) {
        catList.push(
          { label: 'Electronics', value: 1, percent: 45, color: '#5B4DF8', formattedValue: 'Catalog' },
          { label: 'Accessories', value: 1, percent: 30, color: '#0EA5E9', formattedValue: 'Catalog' },
          { label: 'Services', value: 1, percent: 25, color: '#10B981', formattedValue: 'Catalog' },
        );
      }
      setCategoryBreakdown(catList);

      // -------------------------------------------------------------
      // 5. PAYMENT METHODS PIE CHART DATA
      // -------------------------------------------------------------
      const payMethodsMap: Record<string, number> = {
        UPI: 0,
        Cash: 0,
        Card: 0,
        Bank: 0,
      };

      sales.forEach((s: any) => {
        const pm = (s.payment_method || 'CASH').toUpperCase();
        const amt = Number(s.total || 0);
        if (pm.includes('UPI')) payMethodsMap.UPI += amt;
        else if (pm.includes('CARD')) payMethodsMap.Card += amt;
        else if (pm.includes('BANK')) payMethodsMap.Bank += amt;
        else payMethodsMap.Cash += amt;
      });

      const totalPaySum = Object.values(payMethodsMap).reduce((a, b) => a + b, 0);
      const payList: PieChartDataPoint[] = [
        {
          label: 'UPI',
          value: payMethodsMap.UPI,
          percent: totalPaySum > 0 ? Math.round((payMethodsMap.UPI / totalPaySum) * 100) : 40,
          color: '#5B4DF8',
          formattedValue: `₹${payMethodsMap.UPI.toLocaleString('en-IN')}`,
        },
        {
          label: 'Cash',
          value: payMethodsMap.Cash,
          percent: totalPaySum > 0 ? Math.round((payMethodsMap.Cash / totalPaySum) * 100) : 35,
          color: '#10B981',
          formattedValue: `₹${payMethodsMap.Cash.toLocaleString('en-IN')}`,
        },
        {
          label: 'Card',
          value: payMethodsMap.Card,
          percent: totalPaySum > 0 ? Math.round((payMethodsMap.Card / totalPaySum) * 100) : 15,
          color: '#0EA5E9',
          formattedValue: `₹${payMethodsMap.Card.toLocaleString('en-IN')}`,
        },
        {
          label: 'Bank',
          value: payMethodsMap.Bank,
          percent: totalPaySum > 0 ? Math.round((payMethodsMap.Bank / totalPaySum) * 100) : 10,
          color: '#F59E0B',
          formattedValue: `₹${payMethodsMap.Bank.toLocaleString('en-IN')}`,
        },
      ].filter((p) => p.percent > 0);

      setPaymentBreakdown(payList);

      // -------------------------------------------------------------
      // 6. INVENTORY STOCK HEALTH PIE CHART DATA
      // -------------------------------------------------------------
      const stockHealthList: PieChartDataPoint[] = [
        {
          label: 'In Stock',
          value: inStockProducts.length,
          percent: Math.round((inStockProducts.length / totalProductItems) * 100),
          color: '#10B981',
          formattedValue: `${inStockProducts.length} items`,
        },
        {
          label: 'Low Stock',
          value: lowStockProducts.length,
          percent: Math.round((lowStockProducts.length / totalProductItems) * 100),
          color: '#F59E0B',
          formattedValue: `${lowStockProducts.length} items`,
        },
        {
          label: 'Out of Stock',
          value: outOfStockProducts.length,
          percent: Math.round((outOfStockProducts.length / totalProductItems) * 100),
          color: '#EF4444',
          formattedValue: `${outOfStockProducts.length} items`,
        },
      ].filter((item) => item.value > 0 || totalProductsCount === 0);

      if (stockHealthList.length === 0) {
        stockHealthList.push({
          label: 'Optimal Stock',
          value: 1,
          percent: 100,
          color: '#10B981',
          formattedValue: '100%',
        });
      }
      setStockHealthBreakdown(stockHealthList);

      // -------------------------------------------------------------
      // 7. RECENT ACTIVITIES FEED (DYNAMIC & CHRONOLOGICAL)
      // -------------------------------------------------------------
      setActivities(recentActivitiesToday.slice(0, 6));
    } catch (err) {
      console.warn('Dashboard live telemetry note:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on focus and initial load
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

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

  /* Helper to synthesize real activities */
  function salesListActivities(
    sales: any[],
    repairs: any[],
    lowStock: any[],
    purchases: any[],
    orders: any[],
  ): ActivityItem[] {
    const list: ActivityItem[] = [];

    // Sales activities
    sales.slice(0, 4).forEach((s) => {
      const cust = Array.isArray(s.customers) ? s.customers[0]?.name : s.customers?.name || 'Walk-in Customer';
      list.push({
        id: `sale-${s.id}`,
        title: `Invoice #${s.invoice_number || 'INV'}`,
        subtitle: `${cust} • ₹${Number(s.total || 0).toLocaleString('en-IN')} (${s.payment_status || 'PAID'})`,
        time: formatTimeAgo(s.created_at),
        icon: 'check-circle',
        color: '#10B981',
        bg: '#ECFDF5',
        timestamp: new Date(s.created_at).getTime(),
        drawerScreen: 'Sales',
        nestedScreen: 'Invoices',
      });
    });

    // Repair activities
    repairs.slice(0, 3).forEach((r) => {
      const brandModel = [r.device_brand, r.device_model].filter(Boolean).join(' ') || 'Device';
      list.push({
        id: `repair-${r.id}`,
        title: `Repair #${r.ticket_number || 'TKT'} (${r.status || 'Active'})`,
        subtitle: `${brandModel} • ${r.customer_name || 'Customer'}`,
        time: formatTimeAgo(r.created_at),
        icon: 'build-circle',
        color: '#8B5CF6',
        bg: '#F5F3FF',
        timestamp: new Date(r.created_at).getTime(),
        drawerScreen: 'Repairs',
        nestedScreen: 'RepairsHome',
      });
    });

    // Low stock warnings
    lowStock.slice(0, 2).forEach((p) => {
      list.push({
        id: `stock-${p.id}`,
        title: `Low Stock Alert`,
        subtitle: `${p.name} • Only ${p.quantity} units remaining`,
        time: 'Active Alert',
        icon: 'warning-amber',
        color: '#F59E0B',
        bg: '#FFFBEB',
        timestamp: Date.now() - 3600000,
        drawerScreen: 'Inventory',
        nestedScreen: 'LowStockAlert',
      });
    });

    // Orders / Purchases
    purchases.slice(0, 2).forEach((pc) => {
      list.push({
        id: `pur-${pc.id}`,
        title: `Purchase #${pc.invoice_no || 'PO'}`,
        subtitle: `Supplier PO • ₹${Number(pc.total_amount || 0).toLocaleString('en-IN')} (${pc.status || 'Received'})`,
        time: formatTimeAgo(pc.created_at),
        icon: 'shopping-bag',
        color: '#3B82F6',
        bg: '#EFF6FF',
        timestamp: new Date(pc.created_at).getTime(),
        drawerScreen: 'Purchase',
        nestedScreen: 'PurchaseOrders',
      });
    });

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }

  // Render Stat Card with direct navigation
  const renderStatCard = (item: StatItem, index: number) => (
    <FadeInUp
      key={item.title}
      delay={index * 30}
      style={[styles.statCardContainer, isWide && styles.statCardWide]}
    >
      <SpringTouch
        style={{ width: '100%' }}
        onPress={() => navigateTo(item.drawerScreen, item.nestedScreen)}
      >
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

          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
            {item.value}
          </Text>
          <Text style={styles.statLabel} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
      </SpringTouch>
    </FadeInUp>
  );

  // Render Activity Item with tap navigation
  const renderActivityItem = (item: ActivityItem, index: number) => {
    const isLast = index === activities.length - 1;
    return (
      <FadeInUp key={item.id} delay={100 + index * 30}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateTo(item.drawerScreen, item.nestedScreen)}
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
            <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.activitySubtitle} numberOfLines={1}>{item.subtitle}</Text>
          </View>

          <Text style={styles.activityTime}>{item.time}</Text>
        </TouchableOpacity>
      </FadeInUp>
    );
  };

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadDashboardData(true)}
          tintColor={AppColors.primary}
          colors={[AppColors.primary, '#7C3AED']}
        />
      }
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

        <View style={styles.headerRightRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <Icon name="notifications-none" size={21} color={AppColors.textPrimary} />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={[styles.iconBtn, { marginLeft: 7 }]}
            activeOpacity={0.7}
          >
            <Icon name="settings" size={20} color={AppColors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.iconBtn, { marginLeft: 7 }]}
            activeOpacity={0.7}
          >
            <Icon name="logout" size={19} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>
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
              {loading && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginLeft: 8 }} />}
            </View>

            <Text style={styles.heroGreeting}>
              {employeeName ? `Welcome back, ${employeeName}` : 'Welcome, Business Hub'} 👋
            </Text>
            <Text style={styles.heroSubtitle}>
              {heroSummary.subtitle}
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
        <TouchableOpacity
          onPress={() => loadDashboardData(true)}
          activeOpacity={0.7}
          style={styles.refreshBadge}
        >
          <Icon name="refresh" size={13} color={AppColors.primary} />
          <Text style={styles.sectionMeta}>Updated live</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.statGrid, isWide && styles.statGridWide]}>
        {stats.map(renderStatCard)}
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
          <FadeInUp delay={80 + index * 35} style={styles.quickActionOuter}>
            <SpringTouch
              onPress={() => navigateTo(item.drawerScreen, item.nestedScreen)}
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
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { marginHorizontal: 0 }]}>Analytics & Trends</Text>
        <Text style={styles.sectionMeta}>Real-time telemetry</Text>
      </View>

      <View style={[styles.chartsGrid, isWide && styles.chartsGridWide]}>
        {/* 1. EXACT SVG AREA / LINE CHART (MATCHING USER'S SPEC) */}
        <FadeInUp delay={100} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Sales Trend</Text>
                <Text style={styles.chartSubtitle}>Last 7 days performance</Text>
              </View>
              <View style={styles.chartBadge}>
                <Text style={styles.chartBadgeText}>7 Days</Text>
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <SvgAreaLineChart
                data={salesTrend}
                height={175}
                lineColor="#3B82F6"
                dotColor="#3B82F6"
              />
            </View>
          </View>
        </FadeInUp>

        {/* 2. Revenue Dynamics (Income vs Expenses) */}
        <FadeInUp delay={140} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Revenue Dynamics</Text>
                <Text style={styles.chartSubtitle}>Income vs Expense balance</Text>
              </View>
              <View style={[styles.chartBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.chartBadgeText, { color: '#10B981' }]}>
                  {financeRatio.net >= 0 ? '+Surplus' : '-Deficit'}
                </Text>
              </View>
            </View>

            <View style={styles.financeDynamicBox}>
              <View style={styles.financeMetricRow}>
                <View style={styles.financeMetricCol}>
                  <Text style={styles.financeLabel}>Gross Income</Text>
                  <Text style={[styles.financeAmount, { color: '#10B981' }]}>
                    ₹{financeRatio.income.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.financeMetricCol}>
                  <Text style={styles.financeLabel}>Total Expenses</Text>
                  <Text style={[styles.financeAmount, { color: '#EF4444' }]}>
                    ₹{financeRatio.expenses.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Visual Progress Bar */}
              <View style={styles.financeProgressBarTrack}>
                <View
                  style={[
                    styles.financeProgressIncome,
                    {
                      flex: Math.max(financeRatio.income, 1),
                    },
                  ]}
                />
                <View
                  style={[
                    styles.financeProgressExpense,
                    {
                      flex: Math.max(financeRatio.expenses, 0.001),
                    },
                  ]}
                />
              </View>

              <View style={styles.financeSummaryRow}>
                <Text style={styles.financeSummaryText}>
                  Net Balance: <Text style={{ fontWeight: '800', color: financeRatio.net >= 0 ? '#10B981' : '#EF4444' }}>₹{financeRatio.net.toLocaleString('en-IN')}</Text>
                </Text>
              </View>
            </View>
          </View>
        </FadeInUp>

        {/* 3. Category Share Pie / Donut Chart */}
        <FadeInUp delay={180} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Category Breakdown</Text>
                <Text style={styles.chartSubtitle}>Product share by catalog</Text>
              </View>
              <View style={styles.chartBadge}>
                <Text style={styles.chartBadgeText}>Pie Graph</Text>
              </View>
            </View>

            <View style={styles.pieGraphBox}>
              <SvgDonutChart
                data={categoryBreakdown}
                size={124}
                strokeWidth={14}
                centerValue={`${stats.find((s) => s.title === 'Products')?.value || '0'}`}
                centerLabel="Total Items"
              />

              <View style={styles.pieGraphLegend}>
                {categoryBreakdown.map((item) => (
                  <View key={item.label} style={styles.pieLegendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pieLegendTitle} numberOfLines={1}>{item.label}</Text>
                      <Text style={styles.pieLegendSub}>{item.formattedValue}</Text>
                    </View>
                    <Text style={[styles.pieLegendPercent, { color: item.color }]}>
                      {item.percent}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeInUp>

        {/* 4. Payment Methods Distribution Pie / Donut Chart */}
        <FadeInUp delay={220} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Payment Methods Share</Text>
                <Text style={styles.chartSubtitle}>Revenue by tender type</Text>
              </View>
              <View style={[styles.chartBadge, { backgroundColor: '#ECFDF5' }]}>
                <Text style={[styles.chartBadgeText, { color: '#10B981' }]}>Live Pay</Text>
              </View>
            </View>

            <View style={styles.pieGraphBox}>
              <SvgDonutChart
                data={paymentBreakdown}
                size={124}
                strokeWidth={14}
                centerValue={`${paymentBreakdown.length > 0 ? paymentBreakdown[0].label : 'UPI'}`}
                centerLabel="Top Tender"
              />

              <View style={styles.pieGraphLegend}>
                {paymentBreakdown.map((item) => (
                  <View key={item.label} style={styles.pieLegendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pieLegendTitle} numberOfLines={1}>{item.label}</Text>
                      <Text style={styles.pieLegendSub}>{item.formattedValue}</Text>
                    </View>
                    <Text style={[styles.pieLegendPercent, { color: item.color }]}>
                      {item.percent}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeInUp>

        {/* 5. Inventory & Stock Health Donut Chart */}
        <FadeInUp delay={260} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Stock Health Monitor</Text>
                <Text style={styles.chartSubtitle}>Inventory availability ratio</Text>
              </View>
              <Icon name="health-and-safety" size={20} color="#10B981" />
            </View>

            <View style={styles.pieGraphBox}>
              <SvgDonutChart
                data={stockHealthBreakdown}
                size={124}
                strokeWidth={14}
                centerValue={`${stockHealthBreakdown.find((s) => s.label === 'In Stock')?.percent || 100}%`}
                centerLabel="In Stock"
              />

              <View style={styles.pieGraphLegend}>
                {stockHealthBreakdown.map((item) => (
                  <View key={item.label} style={styles.pieLegendRow}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pieLegendTitle} numberOfLines={1}>{item.label}</Text>
                      <Text style={styles.pieLegendSub}>{item.formattedValue}</Text>
                    </View>
                    <Text style={[styles.pieLegendPercent, { color: item.color }]}>
                      {item.percent}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </FadeInUp>

        {/* 6. Order Volume & Pipeline */}
        <FadeInUp delay={300} style={{ width: isWide ? '48%' : '100%' }}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Order Volume & Pipeline</Text>
                <Text style={styles.chartSubtitle}>Active cycle fulfillment</Text>
              </View>
              <Icon name="shopping-bag" size={20} color="#3B82F6" />
            </View>

            <View style={styles.orderPipelineBox}>
              <View style={styles.pipelineRow}>
                <View style={styles.pipelineItem}>
                  <Text style={styles.pipelineNumber}>{orderMetrics.completed}</Text>
                  <Text style={styles.pipelineLabel}>Completed</Text>
                </View>
                <View style={styles.pipelineDivider} />
                <View style={styles.pipelineItem}>
                  <Text style={[styles.pipelineNumber, { color: '#F59E0B' }]}>
                    {orderMetrics.pending}
                  </Text>
                  <Text style={styles.pipelineLabel}>Pending</Text>
                </View>
                <View style={styles.pipelineDivider} />
                <View style={styles.pipelineItem}>
                  <Text style={[styles.pipelineNumber, { color: '#5B4DF8' }]}>
                    {orderMetrics.total}
                  </Text>
                  <Text style={styles.pipelineLabel}>Total Flow</Text>
                </View>
              </View>

              <View style={styles.pipelineBarTrack}>
                <View
                  style={[
                    styles.pipelineBarFill,
                    {
                      width: `${Math.min(100, Math.round((orderMetrics.completed / Math.max(orderMetrics.total, 1)) * 100))}%`,
                      backgroundColor: '#10B981',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </FadeInUp>
      </View>

      {/* RECENT ACTIVITIES */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, { marginHorizontal: 0 }]}>Recent Live Activities</Text>
        <Text style={styles.sectionMeta}>{activities.length} Recorded</Text>
      </View>

      <FadeInUp delay={200}>
        <View style={styles.activitiesCard}>
          {activities.length > 0 ? (
            activities.map(renderActivityItem)
          ) : (
            <View style={styles.emptyActivities}>
              <Icon name="history" size={28} color={AppColors.textMuted} />
              <Text style={styles.emptyActivitiesText}>No recent transactions recorded today.</Text>
            </View>
          )}
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
  headerRightRow: {
    flexDirection: 'row',
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
    position: 'relative',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: AppColors.surface,
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
  heroInner: {
    position: 'relative',
    zIndex: 2,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  refreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEECFE',
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
  chartBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#EEECFE',
  },
  chartBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5B4DF8',
  },

  /* FINANCE METRIC BOX */
  financeDynamicBox: {
    marginTop: 14,
  },
  financeMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  financeMetricCol: {
    flex: 1,
  },
  financeLabel: {
    fontSize: 11.5,
    color: AppColors.textMuted,
    fontWeight: '600',
  },
  financeAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  financeProgressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.surfaceSoft,
    flexDirection: 'row',
    overflow: 'hidden',
    marginTop: 4,
  },
  financeProgressIncome: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  financeProgressExpense: {
    height: '100%',
    backgroundColor: '#EF4444',
  },
  financeSummaryRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  financeSummaryText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },

  /* PIE / DONUT GRAPH BOX */
  pieGraphBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 14,
  },
  pieGraphLegend: {
    flex: 1,
    gap: 7,
  },
  pieLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pieLegendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  pieLegendSub: {
    fontSize: 10.5,
    color: AppColors.textMuted,
    fontWeight: '500',
  },
  pieLegendPercent: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },

  /* ORDER PIPELINE */
  orderPipelineBox: {
    marginTop: 14,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 14,
  },
  pipelineItem: {
    alignItems: 'center',
  },
  pipelineNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10B981',
  },
  pipelineLabel: {
    fontSize: 11,
    color: AppColors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  pipelineDivider: {
    width: 1,
    height: 24,
    backgroundColor: AppColors.border,
  },
  pipelineBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: AppColors.surfaceSoft,
    overflow: 'hidden',
  },
  pipelineBarFill: {
    height: '100%',
    borderRadius: 4,
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
  emptyActivities: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyActivitiesText: {
    fontSize: 12.5,
    color: AppColors.textMuted,
    fontWeight: '500',
  },
});