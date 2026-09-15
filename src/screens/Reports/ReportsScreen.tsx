import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Line,
  Path,
  Circle,
} from 'react-native-svg';

import { AppColors, AppShadows } from '../theme/AppColors';
import { FadeInUp, FloatingGeometricOrb, SpringTouch } from '../theme/Animations';
import {
  ReportsService,
  DateFilterType,
  DateRangeBounds,
  getDateRangeBounds,
  DashboardData,
  ChartDataPoint,
} from '../../services/ReportsService';
import { DateFilterBar } from './components/DateFilterBar';
import { ReportDetailModal, ReportType } from './components/ReportDetailModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ChartTab =
  | 'Sales'
  | 'Income vs Exp'
  | 'Profit'
  | 'Orders'
  | 'Repairs'
  | 'Payment Mode';

interface ReportDirectoryItem {
  id: ReportType;
  title: string;
  subtitle: string;
  icon: any;
  iconBg: string;
  iconColor: string;
}

const REPORT_CLUSTERS: { category: string; items: ReportDirectoryItem[] }[] = [
  {
    category: 'Commercial & Sales',
    items: [
      {
        id: 'Sales',
        title: 'Sales Report',
        subtitle: 'Performance, products, sales channels',
        icon: 'point-of-sale',
        iconBg: '#ECFDF5',
        iconColor: '#10B981',
      },
      {
        id: 'Order',
        title: 'Order Report',
        subtitle: 'Order pipeline, fulfillment, tracking',
        icon: 'shopping-bag',
        iconBg: '#FFF7ED',
        iconColor: '#F97316',
      },
      {
        id: 'ProfitLoss',
        title: 'Profit & Loss Report',
        subtitle: 'Revenue, expenses, margins & P&L',
        icon: 'query-stats',
        iconBg: '#EEECFE',
        iconColor: '#5B4DF8',
      },
    ],
  },
  {
    category: 'Finance & Accounts',
    items: [
      {
        id: 'Income',
        title: 'Income Report',
        subtitle: 'Cash, UPI, and service receipts',
        icon: 'trending-up',
        iconBg: '#ECFDF5',
        iconColor: '#059669',
      },
      {
        id: 'Expense',
        title: 'Expense Report',
        subtitle: 'Category-wise overheads & vendor payouts',
        icon: 'receipt-long',
        iconBg: '#FEF2F2',
        iconColor: '#EF4444',
      },
      {
        id: 'Finance',
        title: 'Finance Report',
        subtitle: 'Consolidated balance sheet & dues',
        icon: 'account-balance-wallet',
        iconBg: '#EFF6FF',
        iconColor: '#3B82F6',
      },
      {
        id: 'Ledger',
        title: 'Ledger Report',
        subtitle: 'Customer & vendor credit/debit balances',
        icon: 'menu-book',
        iconBg: '#FFFBEB',
        iconColor: '#D97706',
      },
      {
        id: 'Transaction',
        title: 'Transaction Report',
        subtitle: 'Chronological cash/bank movements',
        icon: 'swap-horiz',
        iconBg: '#F5F3FF',
        iconColor: '#7C3AED',
      },
    ],
  },
  {
    category: 'Operations & Services',
    items: [
      {
        id: 'Repair',
        title: 'Repair Report',
        subtitle: 'Online/offline tickets, technician metrics',
        icon: 'build',
        iconBg: '#F5F3FF',
        iconColor: '#8B5CF6',
      },
      {
        id: 'Inventory',
        title: 'Inventory Report',
        subtitle: 'Stock levels, valuation & low-stock alerts',
        icon: 'inventory-2',
        iconBg: '#F0F9FF',
        iconColor: '#0EA5E9',
      },
    ],
  },
  {
    category: 'Human Resources',
    items: [
      {
        id: 'Employee',
        title: 'Employee Report',
        subtitle: 'Staff performance, repairs & salary',
        icon: 'badge',
        iconBg: '#EEF2FF',
        iconColor: '#6366F1',
      },
      {
        id: 'Attendance',
        title: 'Attendance Report',
        subtitle: 'Check-in, check-out & total hours',
        icon: 'access-time',
        iconBg: '#ECFDF5',
        iconColor: '#10B981',
      },
      {
        id: 'Leave',
        title: 'Leave Report',
        subtitle: 'Leave requests, approvals & quotas',
        icon: 'event-busy',
        iconBg: '#FEF2F2',
        iconColor: '#EF4444',
      },
      {
        id: 'Payroll',
        title: 'Payroll Report',
        subtitle: 'Disbursements, bonuses & deductions',
        icon: 'payments',
        iconBg: '#FFFBEB',
        iconColor: '#F59E0B',
      },
      {
        id: 'Activity',
        title: 'Activity / Audit Log',
        subtitle: 'System changes & action trail',
        icon: 'history',
        iconBg: '#F1F5F9',
        iconColor: '#475569',
      },
    ],
  },
  {
    category: 'Loans & Credit',
    items: [
      {
        id: 'Loan',
        title: 'Loan Report',
        subtitle: 'Active loans, principal & interest',
        icon: 'account-balance',
        iconBg: '#FFFBEB',
        iconColor: '#B45309',
      },
      {
        id: 'EMI',
        title: 'EMI Schedule Report',
        subtitle: 'Upcoming, paid & overdue installments',
        icon: 'calendar-month',
        iconBg: '#FEF2F2',
        iconColor: '#DC2626',
      },
      {
        id: 'Customer',
        title: 'Customer Report',
        subtitle: 'Customer lifetime value & pending dues',
        icon: 'groups',
        iconBg: '#EFF6FF',
        iconColor: '#2563EB',
      },
    ],
  },
];

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Date Filtering State
  const [selectedFilter, setSelectedFilter] = useState<DateFilterType>('This Month');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();
  const [bounds, setBounds] = useState<DateRangeBounds>(() =>
    getDateRangeBounds('This Month'),
  );

  // Dashboard Aggregated Data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Active Chart Tab
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>('Sales');

  // Drilldown Detail Modal State
  const [activeReportModal, setActiveReportModal] = useState<ReportType | null>(null);

  const fetchDashboard = useCallback(async (currentBounds: DateRangeBounds) => {
    try {
      setLoading(true);
      const data = await ReportsService.getDashboardData(currentBounds);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(bounds);
  }, [bounds, fetchDashboard]);

  const handleSelectFilter = (
    filter: DateFilterType,
    cStart?: Date,
    cEnd?: Date,
  ) => {
    setSelectedFilter(filter);
    if (cStart) setCustomStart(cStart);
    if (cEnd) setCustomEnd(cEnd);
    const newBounds = getDateRangeBounds(filter, cStart, cEnd);
    setBounds(newBounds);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(bounds);
  };

  const chartWidth = Math.min(SCREEN_WIDTH - 64, 380);
  const chartHeight = 120;

  // Render dynamic SVG curve for the chosen chart tab
  const renderChartGraphic = () => {
    if (!dashboardData) return null;

    if (activeChartTab === 'Payment Mode') {
      const dist = dashboardData.charts.paymentDistribution;
      return (
        <View style={styles.paymentDistWrap}>
          {dist.map((item) => (
            <View key={item.method} style={styles.distRow}>
              <View style={styles.distLabelCol}>
                <Text style={styles.distMethodText}>{item.method}</Text>
                <Text style={styles.distAmountText}>₹{item.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.distBarBg}>
                <View
                  style={[
                    styles.distBarFill,
                    {
                      width: `${Math.min(100, Math.max(item.percentage, 3))}%`,
                      backgroundColor:
                        item.method === 'UPI'
                          ? '#10B981'
                          : item.method === 'Cash'
                          ? '#3B82F6'
                          : item.method === 'Card'
                          ? '#8B5CF6'
                          : '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.distPercentText}>{item.percentage}%</Text>
            </View>
          ))}
        </View>
      );
    }

    let points: ChartDataPoint[] = [];
    let isDual = false;

    switch (activeChartTab) {
      case 'Sales':
        points = dashboardData.charts.salesTrend;
        break;
      case 'Income vs Exp':
        points = dashboardData.charts.incomeVsExpense;
        isDual = true;
        break;
      case 'Profit':
        points = dashboardData.charts.profitTrend;
        break;
      case 'Orders':
        points = dashboardData.charts.ordersTrend;
        break;
      case 'Repairs':
        points = dashboardData.charts.repairsTrend;
        break;
    }

    if (points.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No trend data available for this range</Text>
        </View>
      );
    }

    const maxVal = Math.max(
      ...points.map((p) => Math.max(p.value, p.secondaryValue || 0)),
      10,
    );

    const calcY = (val: number) => {
      const ratio = Math.max(0, val) / maxVal;
      return Math.round(chartHeight - ratio * (chartHeight - 30) - 15);
    };

    const stepX = chartWidth / (points.length - 1 || 1);

    // Primary path
    const pathCommands = points.map((p, idx) => {
      const x = idx * stepX;
      const y = calcY(p.value);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    const areaPath = `${pathCommands} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

    // Secondary path (if Dual)
    const secondaryPath = isDual
      ? points.map((p, idx) => {
          const x = idx * stepX;
          const y = calcY(p.secondaryValue || 0);
          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ')
      : '';

    return (
      <View>
        <Svg width={chartWidth} height={chartHeight} style={styles.svgChart}>
          <Defs>
            <SvgLinearGradient id="chartAreaGrad" x1="0%" y1="0%" x2="0%" y2="1">
              <Stop offset="0%" stopColor="#5B4DF8" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#5B4DF8" stopOpacity="0.0" />
            </SvgLinearGradient>
          </Defs>

          {/* Guidelines */}
          <Line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="0" y1="65" x2={chartWidth} y2="65" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <Line x1="0" y1={chartHeight - 5} x2={chartWidth} y2={chartHeight - 5} stroke="#F1F5F9" strokeWidth="1" />

          {/* Area Fill */}
          <Path d={areaPath} fill="url(#chartAreaGrad)" />

          {/* Primary Curve */}
          <Path
            d={pathCommands}
            stroke="#5B4DF8"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Secondary Line for Dual comparison */}
          {isDual && secondaryPath && (
            <Path
              d={secondaryPath}
              stroke="#EF4444"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Points */}
          {points.map((p, idx) => (
            <Circle
              key={idx}
              cx={idx * stepX}
              cy={calcY(p.value)}
              r="4"
              fill="#FFFFFF"
              stroke="#5B4DF8"
              strokeWidth="2"
            />
          ))}
        </Svg>

        {/* Labels row */}
        <View style={styles.chartLabelsRow}>
          {points.map((p, i) => (
            <Text key={i} style={styles.chartMonthText} numberOfLines={1}>
              {p.label}
            </Text>
          ))}
        </View>

        {isDual && (
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#5B4DF8' }]} />
              <Text style={styles.legendText}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Expenses</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const summary = dashboardData?.summary;

  return (
    <View style={styles.flex}>
      {/* Background ambient orbs */}
      <FloatingGeometricOrb
        size={220}
        top={-50}
        right={-50}
        color="rgba(91, 77, 248, 0.08)"
        duration={5500}
        floatDistance={12}
      />
      <FloatingGeometricOrb
        size={150}
        bottom={100}
        left={-40}
        color="rgba(16, 185, 129, 0.06)"
        duration={4500}
        floatDistance={10}
      />

      {/* HEADER */}
      <StatusBar barStyle="dark-content" />
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + 8,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <SpringTouch
            onPress={() => navigation.goBack()}
            activeScale={0.88}
            style={styles.backBtn}
          >
            <Icon name="arrow-back" color={AppColors.textPrimary} size={24} />
          </SpringTouch>
          <View>
            <Text style={styles.headerTitle}>Reports & Analytics</Text>
            <Text style={styles.headerSubtitle}>Multi-tenant business intelligence</Text>
          </View>
        </View>

        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Icon name="refresh" size={20} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      {/* HORIZONTAL DATE FILTER BAR */}
      <DateFilterBar
        selectedFilter={selectedFilter}
        onSelectFilter={handleSelectFilter}
        customStart={customStart}
        customEnd={customEnd}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[AppColors.primary]} />
        }
      >
        {/* HERO CARD: NET BUSINESS PROFIT */}
        <FadeInUp delay={40}>
          <View style={styles.heroBanner}>
            <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
              <Defs>
                <SvgLinearGradient id="repGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#5B4DF8" />
                  <Stop offset="100%" stopColor="#7C3AED" />
                </SvgLinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#repGrad)" />
            </Svg>

            <FloatingGeometricOrb
              size={130}
              top={-35}
              right={-25}
              color="rgba(255, 255, 255, 0.12)"
              duration={4600}
              floatDistance={10}
            />

            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <Text style={styles.heroLabel}>NET BUSINESS PROFIT</Text>
                <View style={styles.periodPill}>
                  <Text style={styles.periodPillText}>{bounds.label}</Text>
                </View>
              </View>

              {loading && !dashboardData ? (
                <ActivityIndicator color="#FFFFFF" size="small" style={{ marginVertical: 12 }} />
              ) : (
                <>
                  <Text style={styles.heroAmount}>
                    ₹{(summary?.netProfit ?? 0).toLocaleString()}
                  </Text>
                  <View style={styles.heroSubRow}>
                    <Text style={styles.heroSubText}>
                      Income: ₹{(summary?.totalIncome ?? 0).toLocaleString()}
                    </Text>
                    <Text style={styles.heroSubDivider}>•</Text>
                    <Text style={styles.heroSubText}>
                      Expenses: ₹{(summary?.totalExpenses ?? 0).toLocaleString()}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </FadeInUp>

        {/* 10 SUMMARY KPI CARDS (2-column responsive grid) */}
        <Text style={styles.sectionHeaderTitle}>Business Overview KPIs</Text>
        <View style={styles.statsGrid}>
          {/* 1. Total Sales */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Sales')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Icon name="point-of-sale" size={18} color="#10B981" />
              </View>
              <Text style={styles.statCardLabel}>Total Sales</Text>
              <Text style={styles.statCardValue}>
                ₹{(summary?.totalSales ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#10B981' }]}>Sales generated</Text>
            </SpringTouch>
          </View>

          {/* 2. Total Income */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Income')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Icon name="trending-up" size={18} color="#059669" />
              </View>
              <Text style={styles.statCardLabel}>Total Income</Text>
              <Text style={styles.statCardValue}>
                ₹{(summary?.totalIncome ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#059669' }]}>Total money received</Text>
            </SpringTouch>
          </View>

          {/* 3. Total Expenses */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Expense')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Icon name="receipt-long" size={18} color="#EF4444" />
              </View>
              <Text style={styles.statCardLabel}>Total Expenses</Text>
              <Text style={styles.statCardValue}>
                ₹{(summary?.totalExpenses ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#EF4444' }]}>Operating costs</Text>
            </SpringTouch>
          </View>

          {/* 4. Net Profit */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('ProfitLoss')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#EEECFE' }]}>
                <Icon name="query-stats" size={18} color="#5B4DF8" />
              </View>
              <Text style={styles.statCardLabel}>Net Profit</Text>
              <Text style={styles.statCardValue}>
                ₹{(summary?.netProfit ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#5B4DF8' }]}>Revenue - Expenses</Text>
            </SpringTouch>
          </View>

          {/* 5. Total Orders */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Order')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#FFF7ED' }]}>
                <Icon name="shopping-bag" size={18} color="#F97316" />
              </View>
              <Text style={styles.statCardLabel}>Total Orders</Text>
              <Text style={styles.statCardValue}>
                {(summary?.totalOrders ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#F97316' }]}>Customer orders</Text>
            </SpringTouch>
          </View>

          {/* 6. Total Repairs */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Repair')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#F5F3FF' }]}>
                <Icon name="build" size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.statCardLabel}>Total Repairs</Text>
              <Text style={styles.statCardValue}>
                {(summary?.totalRepairs ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#8B5CF6' }]}>Service tickets</Text>
            </SpringTouch>
          </View>

          {/* 7. Total Customers */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Customer')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Icon name="groups" size={18} color="#2563EB" />
              </View>
              <Text style={styles.statCardLabel}>Total Customers</Text>
              <Text style={styles.statCardValue}>
                {(summary?.totalCustomers ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#2563EB' }]}>Registered clients</Text>
            </SpringTouch>
          </View>

          {/* 8. Total Employees */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Employee')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#EEF2FF' }]}>
                <Icon name="badge" size={18} color="#6366F1" />
              </View>
              <Text style={styles.statCardLabel}>Total Employees</Text>
              <Text style={styles.statCardValue}>
                {(summary?.totalEmployees ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#6366F1' }]}>Active staff members</Text>
            </SpringTouch>
          </View>

          {/* 9. Pending Payments */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Sales')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <Icon name="pending-actions" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.statCardLabel}>Pending Payments</Text>
              <Text style={styles.statCardValue}>
                ₹{(summary?.pendingPayments ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#F59E0B' }]}>Uncollected balances</Text>
            </SpringTouch>
          </View>

          {/* 10. Outstanding Loans */}
          <View style={styles.statCardContainer}>
            <SpringTouch
              style={styles.statCard}
              activeScale={0.96}
              onPress={() => setActiveReportModal('Loan')}
            >
              <View style={[styles.statIconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Icon name="account-balance" size={18} color="#DC2626" />
              </View>
              <Text style={styles.statCardLabel}>Outstanding Loans</Text>
              <Text style={styles.statCardValue}>
                ₹{(summary?.outstandingLoans ?? 0).toLocaleString()}
              </Text>
              <Text style={[styles.statCardSub, { color: '#DC2626' }]}>Remaining liabilities</Text>
            </SpringTouch>
          </View>
        </View>

        {/* INTERACTIVE CHARTS CARD */}
        <FadeInUp delay={180}>
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <View>
                <Text style={styles.chartTitle}>Visual Trends & Analytics</Text>
                <Text style={styles.chartSub}>Real-time movement over {bounds.label}</Text>
              </View>
            </View>

            {/* Chart Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chartTabsScroll}
            >
              {(
                [
                  'Sales',
                  'Income vs Exp',
                  'Profit',
                  'Orders',
                  'Repairs',
                  'Payment Mode',
                ] as ChartTab[]
              ).map((tab) => {
                const isActive = activeChartTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveChartTab(tab)}
                    style={[styles.chartTabBtn, isActive && styles.chartTabBtnActive]}
                  >
                    <Text
                      style={[
                        styles.chartTabBtnText,
                        isActive && styles.chartTabBtnTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Visual SVG Graphic */}
            <View style={styles.chartContentWrapper}>
              {loading && !dashboardData ? (
                <View style={styles.chartLoading}>
                  <ActivityIndicator size="small" color={AppColors.primary} />
                </View>
              ) : (
                renderChartGraphic()
              )}
            </View>
          </View>
        </FadeInUp>

        {/* 18 DETAILED REPORTS CATALOG */}
        <View style={styles.reportsCatalogSection}>
          <Text style={styles.sectionHeaderTitle}>Detailed Reports Directory</Text>
          <Text style={styles.sectionHeaderSub}>
            Tap any report to view comprehensive tables, filters, and export
          </Text>

          {REPORT_CLUSTERS.map((cluster) => (
            <View key={cluster.category} style={styles.clusterBlock}>
              <Text style={styles.clusterTitle}>{cluster.category}</Text>
              <View style={styles.clusterList}>
                {cluster.items.map((item) => (
                  <SpringTouch
                    key={item.id}
                    onPress={() => setActiveReportModal(item.id)}
                    activeScale={0.98}
                    style={styles.reportListItem}
                  >
                    <View style={[styles.reportIconWrap, { backgroundColor: item.iconBg }]}>
                      <Icon name={item.icon} size={20} color={item.iconColor} />
                    </View>
                    <View style={styles.reportItemBody}>
                      <Text style={styles.reportItemTitle}>{item.title}</Text>
                      <Text style={styles.reportItemSub}>{item.subtitle}</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={AppColors.textMuted} />
                  </SpringTouch>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: Math.max(insets.bottom, 20) + 24 }} />
      </ScrollView>

      {/* REPORT DRILLDOWN DETAIL MODAL */}
      <ReportDetailModal
        visible={activeReportModal !== null}
        reportType={activeReportModal}
        bounds={bounds}
        onClose={() => setActiveReportModal(null)}
      />
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
    paddingBottom: 10,
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
  headerSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  /* HERO BANNER */
  heroBanner: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    padding: 20,
    marginBottom: 20,
    backgroundColor: '#5B4DF8',
    ...AppShadows.glow,
  },
  heroInner: {
    position: 'relative',
    zIndex: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.6,
  },
  periodPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  periodPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  heroSubDivider: {
    color: 'rgba(255, 255, 255, 0.6)',
  },

  /* SECTION TITLES */
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionHeaderSub: {
    fontSize: 12,
    color: AppColors.textMuted,
    fontWeight: '500',
    marginBottom: 14,
  },

  /* STATS 2-COLUMN GRID */
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginBottom: 20,
    marginTop: 8,
  },
  statCardContainer: {
    width: (SCREEN_WIDTH - 42) / 2,
    marginHorizontal: 5,
    marginBottom: 10,
  },
  statCard: {
    width: '100%',
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statCardLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  statCardSub: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* CHARTS CARD */
  chartCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 24,
    ...AppShadows.card,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  chartSub: {
    fontSize: 11.5,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
  chartTabsScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  chartTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.surfaceSoft,
  },
  chartTabBtnActive: {
    backgroundColor: AppColors.primary,
  },
  chartTabBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  chartTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chartContentWrapper: {
    marginTop: 8,
    minHeight: 140,
    justifyContent: 'center',
  },
  chartLoading: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgChart: {
    alignSelf: 'center',
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  chartMonthText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: AppColors.textMuted,
    maxWidth: 50,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: 12,
    color: AppColors.textMuted,
  },

  /* Payment distribution meters */
  paymentDistWrap: {
    paddingVertical: 8,
    gap: 10,
  },
  distRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  distLabelCol: {
    width: 90,
  },
  distMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  distAmountText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
  distBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  distBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  distPercentText: {
    width: 38,
    fontSize: 11.5,
    fontWeight: '700',
    color: AppColors.textPrimary,
    textAlign: 'right',
  },

  /* REPORTS DIRECTORY CATALOG */
  reportsCatalogSection: {
    marginBottom: 20,
  },
  clusterBlock: {
    marginBottom: 16,
  },
  clusterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  clusterList: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
    ...AppShadows.subtle,
  },
  reportListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderSubtle,
  },
  reportIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportItemBody: {
    flex: 1,
  },
  reportItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  reportItemSub: {
    fontSize: 11,
    fontWeight: '500',
    color: AppColors.textMuted,
  },
});
