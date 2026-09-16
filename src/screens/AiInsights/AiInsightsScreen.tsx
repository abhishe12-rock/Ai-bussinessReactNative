import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { AppColors, AppShadows } from '../theme/AppColors';
import { FadeInUp, SpringTouch } from '../theme/Animations';
import { AiService } from '../../services/AiService';

export interface InsightData {
  id: string;
  title: string;
  preview: string;
  type: 'critical' | 'warning' | 'attention' | 'positive';
  actionLabel: string;
  targetScreen: string;
  icon: string;
  color: string;
  bg: string;
}

type Timeframe = 'Today' | 'This Week' | 'This Month';

/* ============================================================
COMPREHENSIVE ROUTE MAP FOR NESTED STACK ROUTING
============================================================ */

const ROUTE_MAP: Record<string, { drawerScreen: string; nestedScreen?: string }> = {
  // Customers
  customerlist: { drawerScreen: 'CustomerList', nestedScreen: 'CustomerListHome' },
  customerlisthome: { drawerScreen: 'CustomerList', nestedScreen: 'CustomerListHome' },
  customers: { drawerScreen: 'CustomerList', nestedScreen: 'CustomerListHome' },
  addcustomer: { drawerScreen: 'CustomerList', nestedScreen: 'AddCustomer' },
  customerdetails: { drawerScreen: 'CustomerList', nestedScreen: 'CustomerDetails' },

  // Inventory & Stock
  inventory: { drawerScreen: 'Inventory', nestedScreen: 'InventoryHome' },
  inventoryhome: { drawerScreen: 'Inventory', nestedScreen: 'InventoryHome' },
  products: { drawerScreen: 'Inventory', nestedScreen: 'Products' },
  product: { drawerScreen: 'Inventory', nestedScreen: 'Products' },
  lowstockalert: { drawerScreen: 'Inventory', nestedScreen: 'LowStockAlert' },
  lowstock: { drawerScreen: 'Inventory', nestedScreen: 'LowStockAlert' },
  addproduct: { drawerScreen: 'Inventory', nestedScreen: 'AddProduct' },
  categories: { drawerScreen: 'Inventory', nestedScreen: 'Categories' },
  brands: { drawerScreen: 'Inventory', nestedScreen: 'Brands' },
  suppliers: { drawerScreen: 'Inventory', nestedScreen: 'Suppliers' },
  stockquantity: { drawerScreen: 'Inventory', nestedScreen: 'StockQuantity' },

  // Sales & Invoices
  sales: { drawerScreen: 'Sales', nestedScreen: 'SalesHome' },
  saleshome: { drawerScreen: 'Sales', nestedScreen: 'SalesHome' },
  saleshistory: { drawerScreen: 'Sales', nestedScreen: 'SalesHistory' },
  newsale: { drawerScreen: 'Sales', nestedScreen: 'NewSale' },
  invoices: { drawerScreen: 'Sales', nestedScreen: 'Invoices' },
  invoice: { drawerScreen: 'Sales', nestedScreen: 'Invoices' },
  saleinvoice: { drawerScreen: 'Sales', nestedScreen: 'SaleInvoice' },
  payments: { drawerScreen: 'Sales', nestedScreen: 'Payments' },
  returns: { drawerScreen: 'Sales', nestedScreen: 'Returns' },

  // Repairs
  repairs: { drawerScreen: 'Repairs', nestedScreen: 'RepairsHome' },
  repairshome: { drawerScreen: 'Repairs', nestedScreen: 'RepairsHome' },
  repair: { drawerScreen: 'Repairs', nestedScreen: 'RepairsHome' },
  createrepair: { drawerScreen: 'Repairs', nestedScreen: 'CreateRepair' },

  // Finance
  finance: { drawerScreen: 'Finance', nestedScreen: 'FinanceHome' },
  financehome: { drawerScreen: 'Finance', nestedScreen: 'FinanceHome' },
  income: { drawerScreen: 'Finance', nestedScreen: 'Income' },
  expenses: { drawerScreen: 'Finance', nestedScreen: 'Expenses' },
  expense: { drawerScreen: 'Finance', nestedScreen: 'Expenses' },
  loans: { drawerScreen: 'Finance', nestedScreen: 'Loans' },
  emi: { drawerScreen: 'Finance', nestedScreen: 'Emi' },
  transactions: { drawerScreen: 'Finance', nestedScreen: 'Transactions' },
  ledger: { drawerScreen: 'Finance', nestedScreen: 'Ledger' },

  // Orders
  orders: { drawerScreen: 'Orders', nestedScreen: 'OrdersHome' },
  ordershome: { drawerScreen: 'Orders', nestedScreen: 'OrdersHome' },
  order: { drawerScreen: 'Orders', nestedScreen: 'OrdersHome' },

  // Purchase
  purchase: { drawerScreen: 'Purchase', nestedScreen: 'PurchaseHome' },
  purchasehome: { drawerScreen: 'Purchase', nestedScreen: 'PurchaseHome' },
  purchaseorders: { drawerScreen: 'Purchase', nestedScreen: 'PurchaseOrders' },
  createpurchaseorder: { drawerScreen: 'Purchase', nestedScreen: 'CreatePurchaseOrder' },
  stockreceiving: { drawerScreen: 'Purchase', nestedScreen: 'StockReceiving' },
  purchasehistory: { drawerScreen: 'Purchase', nestedScreen: 'PurchaseHistory' },

  // Employee
  employeelist: { drawerScreen: 'EmployeeList', nestedScreen: 'EmployeeListHome' },
  employeelisthome: { drawerScreen: 'EmployeeList', nestedScreen: 'EmployeeListHome' },
  employees: { drawerScreen: 'EmployeeList', nestedScreen: 'EmployeeListHome' },
  attendance: { drawerScreen: 'EmployeeList', nestedScreen: 'Attendance' },
  leave: { drawerScreen: 'EmployeeList', nestedScreen: 'Leave' },
  activitylog: { drawerScreen: 'EmployeeList', nestedScreen: 'ActivityLog' },
  manageaccess: { drawerScreen: 'EmployeeList', nestedScreen: 'ManageAccess' },

  // Standalone Top-Level Modules
  reports: { drawerScreen: 'Reports' },
  aiassistant: { drawerScreen: 'AiAssistant' },
  aiagents: { drawerScreen: 'AiAgents' },
  mcptools: { drawerScreen: 'McpTools' },
  documents: { drawerScreen: 'Documents' },
  dashboard: { drawerScreen: 'Dashboard' },
  notifications: { drawerScreen: 'Notifications' },
  settings: { drawerScreen: 'Settings' },
};

const DEFAULT_INSIGHTS: InsightData[] = [
  {
    id: 'def-1',
    title: 'Low Stock Replenishment Alert',
    preview: 'Several inventory items have fallen below their safety threshold. Reorder now to maintain fulfillment velocity.',
    type: 'warning',
    actionLabel: 'Check Low Stock',
    targetScreen: 'LowStockAlert',
    icon: 'alert-outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    id: 'def-2',
    title: 'Sales & Revenue Momentum',
    preview: 'Recent transactions show healthy turnover. Review invoices and customer receipts for the current billing cycle.',
    type: 'positive',
    actionLabel: 'View Sales',
    targetScreen: 'SalesHistory',
    icon: 'trending-up',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    id: 'def-3',
    title: 'Pending Device Repairs Pipeline',
    preview: 'Service tickets are currently active in workshop queue. Update technician statuses to notify customers.',
    type: 'attention',
    actionLabel: 'Manage Repairs',
    targetScreen: 'RepairsHome',
    icon: 'information-outline',
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'def-4',
    title: 'Operating Cash Flow & Expenses',
    preview: 'Track monthly overhead, supplier payments, and net profit margins to optimize business working capital.',
    type: 'critical',
    actionLabel: 'Analyze Finance',
    targetScreen: 'FinanceHome',
    icon: 'alert-circle-outline',
    color: '#EF4444',
    bg: '#FEF2F2',
  },
];

export default function AiInsightsScreen() {
  const navigation = useNavigation<any>();
  const [insights, setInsights] = useState<InsightData[]>(DEFAULT_INSIGHTS);
  const [isLoading, setIsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('This Month');

  const fetchInsights = useCallback(async (tf: Timeframe = timeframe) => {
    setIsLoading(true);
    try {
      const businessContext = await AiService.getBusinessContext();
      const response = await AiService.promptGemini(
        `You are an AI Business Analyst. Based on the store's LIVE business data context for the period "${tf}", generate an array of exactly 4 insight objects.
        Return ONLY valid JSON. No markdown code blocks.
        Format:
        [
          {
            "id": "1",
            "title": "String (Short headline)",
            "preview": "String (1-2 sentences with exact numbers from context)",
            "type": "critical" | "warning" | "attention" | "positive",
            "actionLabel": "String (e.g. 'View Customers', 'View Inventory', 'View Sales', 'View Repairs', 'Analyze Expenses')",
            "targetScreen": "CustomerList" | "LowStockAlert" | "Invoices" | "RepairsHome" | "FinanceHome" | "Products" | "SalesHistory"
          }
        ]`,
        `Timeframe: ${tf}\nContext:\n${businessContext}\nGenerate insights based strictly on this live business context.`,
        true
      );

      let parsed: any[] = [];
      try {
        parsed = JSON.parse(response);
      } catch {
        const match = response.match(/\[[\s\S]*\]/);
        if (match) parsed = JSON.parse(match[0]);
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        const mappedInsights: InsightData[] = parsed.map((item: any, idx: number) => {
          let icon = 'lightbulb-outline';
          let color = '#3B82F6';
          let bg = '#EFF6FF';

          switch (item.type) {
            case 'critical':
              icon = 'alert-circle-outline';
              color = '#EF4444';
              bg = '#FEF2F2';
              break;
            case 'warning':
              icon = 'alert-outline';
              color = '#F59E0B';
              bg = '#FFFBEB';
              break;
            case 'attention':
              icon = 'information-outline';
              color = '#3B82F6';
              bg = '#EFF6FF';
              break;
            case 'positive':
              icon = 'trending-up';
              color = '#10B981';
              bg = '#ECFDF5';
              break;
          }

          return {
            id: item.id || `insight-${idx}`,
            title: item.title || 'Business Insight',
            preview: item.preview || '',
            type: item.type || 'attention',
            actionLabel: item.actionLabel || 'View Details',
            targetScreen: item.targetScreen || 'Dashboard',
            icon,
            color,
            bg,
          };
        });

        setInsights(mappedInsights);
      }
    } catch (err: any) {
      console.warn('AiInsights fetch notice:', err);
      // Keep default insights so the screen remains functional
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchInsights(timeframe);
  }, [timeframe, fetchInsights]);

  /* ============================================================
  ROBUST NAVIGATION ROUTER TO PREVENT UNHANDLED ACTION WARNINGS
  ============================================================ */
  const handleAction = useCallback(
    (target: string) => {
      if (!target) return;
      const cleanKey = target.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const routeInfo = ROUTE_MAP[cleanKey];

      try {
        if (routeInfo) {
          if (routeInfo.nestedScreen) {
            navigation.navigate(routeInfo.drawerScreen, { screen: routeInfo.nestedScreen });
          } else {
            navigation.navigate(routeInfo.drawerScreen);
          }
        } else {
          // Fallback: check if target directly matches a drawer screen
          navigation.navigate(target);
        }
      } catch (err) {
        console.warn(`Navigation error targeting "${target}":`, err);
        try {
          navigation.navigate('Dashboard');
        } catch {}
      }
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="menu" size={24} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>AI Insights</Text>
            <Text style={styles.headerSubtitle}>Live business analysis & alerts</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => fetchInsights(timeframe)}
          style={styles.refreshBtn}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="refresh" size={22} color={AppColors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HeaderCard />

        {/* Timeframe Filter Tabs */}
        <View style={styles.timeframeTabsRow}>
          {(['Today', 'This Week', 'This Month'] as Timeframe[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframeTab, timeframe === tf && styles.timeframeTabActive]}
              onPress={() => setTimeframe(tf)}
              activeOpacity={0.8}
            >
              <Text style={[styles.timeframeTabText, timeframe === tf && styles.timeframeTabTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={AppColors.primary} size="large" />
            <Text style={styles.loadingText}>Analyzing live business data for {timeframe}...</Text>
          </View>
        ) : (
          insights.map((item, idx) => (
            <FadeInUp key={item.id} delay={idx * 50} style={styles.cardWrapper}>
              <InsightCard data={item} onAction={() => handleAction(item.targetScreen)} />
            </FadeInUp>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const HeaderCard = () => (
  <View style={styles.headerCardContainer}>
    <View style={styles.headerCardInner}>
      <View style={styles.headerCardIconBox}>
        <MaterialCommunityIcons name="auto-fix" color="#FFFFFF" size={22} />
      </View>
      <View style={styles.headerCardContent}>
        <Text style={styles.headerCardTitle}>Live Business Intelligence</Text>
        <Text style={styles.headerCardSubtitle}>
          AI continuously monitors your sales, stock, repairs & finances
        </Text>
      </View>
    </View>
  </View>
);

const InsightCard = ({ data, onAction }: { data: InsightData; onAction: () => void }) => {
  const getTypeBadge = (type: InsightData['type']) => {
    switch (type) {
      case 'critical':
        return { label: 'CRITICAL', color: '#EF4444', bg: '#FEF2F2' };
      case 'warning':
        return { label: 'WARNING', color: '#F59E0B', bg: '#FFFBEB' };
      case 'attention':
        return { label: 'ATTENTION', color: '#3B82F6', bg: '#EFF6FF' };
      case 'positive':
        return { label: 'POSITIVE', color: '#10B981', bg: '#ECFDF5' };
    }
  };

  const badge = getTypeBadge(data.type);

  return (
    <SpringTouch style={{ width: '100%' }} onPress={onAction}>
      <View style={styles.insightCard}>
        <View style={styles.cardTopRow}>
          <View style={[styles.insightIconBox, { backgroundColor: data.bg }]}>
            <MaterialCommunityIcons name={data.icon} color={data.color} size={22} />
          </View>
          <View style={styles.insightHeaderCol}>
            <View style={styles.badgeRow}>
              <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.typeBadgeText, { color: badge.color }]}>{badge.label}</Text>
              </View>
            </View>
            <Text style={styles.insightTitle}>{data.title}</Text>
          </View>
        </View>

        <Text style={styles.insightPreview}>{data.preview}</Text>

        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.actionBtnText}>{data.actionLabel}</Text>
          <MaterialCommunityIcons name="arrow-right" color={AppColors.primary} size={16} />
        </TouchableOpacity>
      </View>
    </SpringTouch>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    backgroundColor: AppColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  headerTextCol: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },

  headerCardContainer: {
    backgroundColor: '#5B4DF8',
    borderRadius: 16,
    ...AppShadows.glow,
    marginBottom: 16,
  },
  headerCardInner: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  headerCardIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  headerCardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerCardTitle: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerCardSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    lineHeight: 16,
  },

  timeframeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  timeframeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  timeframeTabActive: {
    backgroundColor: AppColors.surface,
    ...AppShadows.card,
  },
  timeframeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  timeframeTabTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },

  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: AppColors.textSecondary,
    fontWeight: '500',
    fontSize: 13.5,
    textAlign: 'center',
  },

  cardWrapper: {
    marginBottom: 14,
  },
  insightCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    ...AppShadows.card,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightHeaderCol: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  insightTitle: {
    color: AppColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  insightPreview: {
    color: AppColors.textSecondary,
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: 14,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AppColors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
});
