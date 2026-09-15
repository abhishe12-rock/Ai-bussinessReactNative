import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppColors, AppShadows } from '../../theme/AppColors';
import {
  ReportsService,
  DateRangeBounds,
} from '../../../services/ReportsService';
import { exportToCsv, exportToStatement } from '../utils/exportUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type ReportType =
  | 'Sales'
  | 'Order'
  | 'Income'
  | 'Expense'
  | 'ProfitLoss'
  | 'Repair'
  | 'Employee'
  | 'Attendance'
  | 'Leave'
  | 'Payroll'
  | 'Customer'
  | 'Inventory'
  | 'Finance'
  | 'Loan'
  | 'EMI'
  | 'Ledger'
  | 'Transaction'
  | 'Activity';

interface ReportDetailModalProps {
  visible: boolean;
  reportType: ReportType | null;
  bounds: DateRangeBounds;
  onClose: () => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  visible,
  reportType,
  bounds,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadData = useCallback(async () => {
    if (!reportType) return;
    setLoading(true);
    try {
      let data: any = null;
      switch (reportType) {
        case 'Sales':
          data = await ReportsService.getSalesReport(bounds);
          break;
        case 'Order':
          data = await ReportsService.getOrderReport(bounds);
          break;
        case 'Income':
          data = await ReportsService.getIncomeReport(bounds);
          break;
        case 'Expense':
          data = await ReportsService.getExpenseReport(bounds);
          break;
        case 'ProfitLoss':
          data = await ReportsService.getProfitLossReport(bounds);
          break;
        case 'Repair':
          data = await ReportsService.getRepairReport(bounds);
          break;
        case 'Employee':
          data = await ReportsService.getEmployeeReport(bounds);
          break;
        case 'Attendance':
          data = await ReportsService.getAttendanceReport(bounds);
          break;
        case 'Leave':
          data = await ReportsService.getLeaveReport(bounds);
          break;
        case 'Payroll':
          data = await ReportsService.getPayrollReport();
          break;
        case 'Customer':
          data = await ReportsService.getCustomerReport();
          break;
        case 'Inventory':
          data = await ReportsService.getInventoryReport();
          break;
        case 'Finance':
          data = await ReportsService.getFinanceReport(bounds);
          break;
        case 'Loan':
          data = await ReportsService.getLoanReport();
          break;
        case 'EMI':
          data = await ReportsService.getEmiReport();
          break;
        case 'Ledger':
          data = await ReportsService.getLedgerReport(bounds);
          break;
        case 'Transaction':
          data = await ReportsService.getTransactionReport(bounds);
          break;
        case 'Activity':
          data = await ReportsService.getActivityReport(bounds);
          break;
      }
      setReportData(data);
    } catch (e) {
      console.error('Error fetching report data:', e);
    } finally {
      setLoading(false);
    }
  }, [reportType, bounds]);

  useEffect(() => {
    if (visible && reportType) {
      loadData();
    } else {
      setReportData(null);
      setSearchQuery('');
      setStatusFilter('All');
    }
  }, [visible, reportType, loadData]);

  const getReportTitle = () => {
    switch (reportType) {
      case 'Sales': return 'Sales Performance Report';
      case 'Order': return 'Order Activity Report';
      case 'Income': return 'Business Income Report';
      case 'Expense': return 'Expense Analysis Report';
      case 'ProfitLoss': return 'Profit & Loss Statement';
      case 'Repair': return 'Repair Business Report';
      case 'Employee': return 'Employee Performance Report';
      case 'Attendance': return 'Attendance & Hours Report';
      case 'Leave': return 'Employee Leave Report';
      case 'Payroll': return 'Payroll & Salary Report';
      case 'Customer': return 'Customer Activity & Dues';
      case 'Inventory': return 'Inventory & Valuation Report';
      case 'Finance': return 'Finance & Accounts Overview';
      case 'Loan': return 'Business Loans Report';
      case 'EMI': return 'Loan EMI Schedule Report';
      case 'Ledger': return 'Customer & Vendor Ledger';
      case 'Transaction': return 'All Financial Transactions';
      case 'Activity': return 'System Activity & Audit Log';
      default: return 'Report Details';
    }
  };

  const getCategoryForReport = (type: ReportType | null): string => {
    switch (type) {
      case 'Sales':
      case 'Order':
      case 'ProfitLoss':
        return 'Commercial & Sales';
      case 'Income':
      case 'Expense':
      case 'Finance':
      case 'Ledger':
      case 'Transaction':
        return 'Finance & Accounts';
      case 'Repair':
      case 'Inventory':
        return 'Operations & Services';
      case 'Employee':
      case 'Attendance':
      case 'Leave':
      case 'Payroll':
      case 'Activity':
        return 'Human Resources';
      case 'Loan':
      case 'EMI':
      case 'Customer':
        return 'Loans & Credit';
      default:
        return 'Reports & Analytics';
    }
  };

  const getFilterChips = (): string[] => {
    switch (reportType) {
      case 'Sales':
        return ['All', 'Paid', 'Pending', 'Cancelled'];
      case 'Order':
        return ['All', 'Pending', 'Processing', 'Delivered', 'Cancelled'];
      case 'Repair':
        return ['All', 'Pending', 'In Progress', 'Completed', 'Rejected'];
      case 'Attendance':
        return ['All', 'Present', 'Absent', 'Late', 'Leave'];
      case 'Leave':
        return ['All', 'Pending', 'Approved', 'Rejected'];
      case 'Payroll':
        return ['All', 'Paid', 'Pending'];
      case 'Inventory':
        return ['All', 'Good', 'Low Stock', 'Out of Stock'];
      case 'Loan':
        return ['All', 'Active', 'Completed'];
      case 'EMI':
        return ['All', 'Paid', 'Pending', 'Overdue'];
      case 'Transaction':
        return ['All', 'Income', 'Expense'];
      default:
        return [];
    }
  };

  // Filtered rows for table
  const filteredRows = useMemo(() => {
    if (!reportData || !reportData.rows) return [];
    let rows: any[] = reportData.rows;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((r) =>
        Object.values(r).some((val) =>
          String(val).toLowerCase().includes(q),
        ),
      );
    }

    if (statusFilter !== 'All') {
      rows = rows.filter((r) => {
        const val = r.status || r.type || r.category;
        return String(val).toLowerCase() === statusFilter.toLowerCase();
      });
    }

    return rows;
  }, [reportData, searchQuery, statusFilter]);

  // Export handlers
  const handleExportCsv = () => {
    if (!reportData) return;
    const title = getReportTitle();
    const headers = getTableHeaders();
    const rows = filteredRows.map((r) => getTableRowValues(r));
    exportToCsv(title, headers, rows);
  };

  const handleExportStatement = () => {
    if (!reportData) return;
    const title = getReportTitle();
    const headers = getTableHeaders();
    const rows = filteredRows.map((r) => getTableRowValues(r));
    const metrics: Record<string, any> = {};
    if (reportData.metrics) {
      Object.entries(reportData.metrics).forEach(([k, v]) => {
        if (typeof v === 'number' || typeof v === 'string') {
          metrics[formatMetricKey(k)] = v;
        }
      });
    }
    exportToStatement(title, metrics, headers, rows);
  };

  // Column definitions based on report
  const getTableHeaders = (): string[] => {
    switch (reportType) {
      case 'Sales':
        return ['Date', 'Sale ID', 'Customer', 'Amount', 'Payment', 'Status'];
      case 'Order':
        return ['Order ID', 'Date', 'Customer', 'Amount', 'Payment', 'Status'];
      case 'Income':
        return ['Date', 'ID', 'Type', 'Customer', 'Amount', 'Description'];
      case 'Expense':
        return ['Date', 'ID', 'Category', 'Vendor', 'Amount', 'Description'];
      case 'Repair':
        return ['Repair ID', 'Date', 'Customer', 'Device', 'Type', 'Staff', 'Amount', 'Status'];
      case 'Employee':
        return ['Code', 'Name', 'Department', 'Role', 'Present', 'Absent', 'Repairs', 'Salary'];
      case 'Attendance':
        return ['Employee', 'Date', 'Check-In', 'Check-Out', 'Hours', 'Status'];
      case 'Leave':
        return ['Employee', 'Type', 'From', 'To', 'Days', 'Status'];
      case 'Payroll':
        return ['Employee', 'Month', 'Basic', 'Allowances', 'Deductions', 'Net Salary', 'Status'];
      case 'Customer':
        return ['Customer', 'Phone', 'Orders', 'Repairs', 'Purchases', 'Paid', 'Outstanding'];
      case 'Inventory':
        return ['Product', 'Category', 'Stock', 'Purchase (₹)', 'Selling (₹)', 'Status'];
      case 'Loan':
        return ['Loan Name', 'Principal', 'Interest', 'Duration', 'Paid', 'Outstanding', 'Status'];
      case 'EMI':
        return ['Loan', 'EMI No', 'Due Date', 'Amount', 'Paid Date', 'Status'];
      case 'Ledger':
        return ['Date', 'Account', 'Reference', 'Debit', 'Credit', 'Balance'];
      case 'Transaction':
        return ['Date', 'ID', 'Type', 'Description', 'Credit', 'Debit', 'Balance'];
      case 'Activity':
        return ['Date/Time', 'User', 'Module', 'Action', 'Details'];
      default:
        return ['Field 1', 'Field 2', 'Field 3'];
    }
  };

  const getTableRowValues = (r: any): (string | number)[] => {
    switch (reportType) {
      case 'Sales':
        return [r.date, r.saleId, r.customer, `₹${r.amount.toLocaleString()}`, r.paymentMethod, r.status];
      case 'Order':
        return [r.orderId, r.date, r.customer, `₹${r.amount.toLocaleString()}`, r.paymentMethod, r.status];
      case 'Income':
        return [r.date, r.incomeId, r.type, r.customer, `₹${r.amount.toLocaleString()}`, r.description];
      case 'Expense':
        return [r.date, r.expenseId, r.category, r.vendor, `₹${r.amount.toLocaleString()}`, r.description];
      case 'Repair':
        return [r.repairId, r.date, r.customer, r.device, r.type, r.employee, `₹${r.amount.toLocaleString()}`, r.status];
      case 'Employee':
        return [r.code, r.name, r.department, r.role, r.presentDays, r.absentDays, r.repairsCompleted, `₹${r.basicSalary.toLocaleString()}`];
      case 'Attendance':
        return [r.employee, r.date, r.checkIn, r.checkOut, r.hours, r.status];
      case 'Leave':
        return [r.employee, r.leaveType, r.from, r.to, r.days, r.status];
      case 'Payroll':
        return [r.employee, r.month, `₹${r.basicSalary.toLocaleString()}`, `₹${r.allowances.toLocaleString()}`, `₹${r.deductions.toLocaleString()}`, `₹${r.netSalary.toLocaleString()}`, r.status];
      case 'Customer':
        return [r.name, r.phone, r.orders, r.repairs, `₹${r.purchases.toLocaleString()}`, `₹${r.paid.toLocaleString()}`, `₹${r.outstanding.toLocaleString()}`];
      case 'Inventory':
        return [r.name, r.category, r.stock, `₹${r.purchasePrice.toLocaleString()}`, `₹${r.sellingPrice.toLocaleString()}`, r.status];
      case 'Loan':
        return [r.name, `₹${r.principal.toLocaleString()}`, r.interestRate, `${r.durationMonths}m`, `₹${r.paid.toLocaleString()}`, `₹${r.outstanding.toLocaleString()}`, r.status];
      case 'EMI':
        return [r.loanName, r.emiNo, r.dueDate, `₹${r.amount.toLocaleString()}`, r.paidDate, r.status];
      case 'Ledger':
        return [r.date, r.account, r.reference, r.debit > 0 ? `₹${r.debit.toLocaleString()}` : '-', r.credit > 0 ? `₹${r.credit.toLocaleString()}` : '-', `₹${r.balance.toLocaleString()}`];
      case 'Transaction':
        return [r.date, r.txId, r.type, r.description, r.credit > 0 ? `₹${r.credit.toLocaleString()}` : '-', r.debit > 0 ? `₹${r.debit.toLocaleString()}` : '-', `₹${r.balance.toLocaleString()}`];
      case 'Activity':
        return [r.dateTime, r.user, r.module, r.action, r.details];
      default:
        return Object.values(r);
    }
  };

  const formatMetricKey = (k: string) => {
    return k
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  };

  const renderStatusBadge = (status: string) => {
    const s = String(status || '').toUpperCase();
    let bg = '#F1F5F9';
    let text = AppColors.textSecondary;

    if (s.includes('PAID') || s.includes('COMPLETED') || s.includes('APPROVED') || s.includes('GOOD') || s.includes('PRESENT') || s.includes('DELIVERED')) {
      bg = '#ECFDF5';
      text = '#10B981';
    } else if (s.includes('PENDING') || s.includes('PROGRESS') || s.includes('LOW') || s.includes('LATE') || s.includes('PROCESSING')) {
      bg = '#FFFBEB';
      text = '#F59E0B';
    } else if (s.includes('CANCEL') || s.includes('REJECT') || s.includes('OUT') || s.includes('OVERDUE') || s.includes('ABSENT')) {
      bg = '#FEF2F2';
      text = '#EF4444';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  const filterChips = getFilterChips();

  // Bottom action bar safe padding calculation (avoids overlapping system nav buttons)
  const safeBottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 22 : 16) + 12;
  const bottomSpacerHeight = safeBottomPadding + 65;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <StatusBar barStyle="dark-content" />
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + 10,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.headerBackBtn}
            activeOpacity={0.7}
          >
            <Icon name="arrow-back" size={22} color={AppColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <View style={styles.categoryBadgeRow}>
              <View style={styles.reportCategoryPill}>
                <Text style={styles.reportCategoryText}>
                  {getCategoryForReport(reportType)}
                </Text>
              </View>
              <View style={styles.periodBadge}>
                <Icon name="calendar-today" size={10} color={AppColors.primary} />
                <Text style={styles.periodText}>{bounds.label}</Text>
              </View>
            </View>
            <Text style={styles.reportTitle} numberOfLines={1}>
              {getReportTitle()}
            </Text>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
          >
            <Icon name="close" size={20} color={AppColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppColors.primary} />
            <Text style={styles.loadingText}>Generating {reportType} Report...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top KPI Metric Cards */}
            {reportData?.metrics && (
              <View style={styles.metricsGrid}>
                {Object.entries(reportData.metrics).map(([key, value]) => {
                  if (typeof value === 'object') return null;
                  const isCurrency =
                    key.toLowerCase().includes('amount') ||
                    key.toLowerCase().includes('revenue') ||
                    key.toLowerCase().includes('salary') ||
                    key.toLowerCase().includes('profit') ||
                    key.toLowerCase().includes('expense') ||
                    key.toLowerCase().includes('borrowed') ||
                    key.toLowerCase().includes('repaid') ||
                    key.toLowerCase().includes('value');
                  const displayValue =
                    isCurrency && typeof value === 'number'
                      ? `₹${value.toLocaleString()}`
                      : String(value);

                  return (
                    <View key={key} style={styles.metricCard}>
                      <Text style={styles.metricLabel}>{formatMetricKey(key)}</Text>
                      <Text style={styles.metricValue}>{displayValue}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {/* COMMERCIAL & SALES: 1. Sales Report - Payment Methods Distribution */}
            {reportType === 'Sales' && reportData?.paymentMethods && (
              <View style={styles.breakdownCard}>
                <Text style={styles.sectionHeaderTitle}>Payment Methods Distribution</Text>
                <View style={styles.paymentDistWrap}>
                  {Object.entries(reportData.paymentMethods).map(([method, amount]: [string, any]) => {
                    const total = reportData.metrics?.totalSalesAmount || 1;
                    const pct = Math.round((Number(amount) / total) * 100);
                    return (
                      <View key={method} style={styles.distRow}>
                        <View style={styles.distLabelCol}>
                          <Text style={styles.distMethodText}>{method}</Text>
                          <Text style={styles.distAmountText}>₹{Number(amount).toLocaleString()}</Text>
                        </View>
                        <View style={styles.distBarBg}>
                          <View
                            style={[
                              styles.distBarFill,
                              {
                                width: `${Math.min(100, Math.max(pct, 4))}%`,
                                backgroundColor:
                                  method === 'UPI'
                                    ? '#10B981'
                                    : method === 'Cash'
                                    ? '#3B82F6'
                                    : method === 'Card'
                                    ? '#8B5CF6'
                                    : '#F59E0B',
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.distPercentText}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* COMMERCIAL & SALES: 2. Order Report - Pipeline Breakdown */}
            {reportType === 'Order' && reportData?.metrics && (
              <View style={styles.breakdownCard}>
                <Text style={styles.sectionHeaderTitle}>Order Status Pipeline</Text>
                <View style={styles.orderPipelineGrid}>
                  <View style={[styles.pipelinePill, { backgroundColor: '#FFFBEB' }]}>
                    <Text style={[styles.pipelineCount, { color: '#F59E0B' }]}>
                      {reportData.metrics.pendingOrders}
                    </Text>
                    <Text style={styles.pipelineLabel}>Pending</Text>
                  </View>
                  <View style={[styles.pipelinePill, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.pipelineCount, { color: '#3B82F6' }]}>
                      {reportData.metrics.processingOrders}
                    </Text>
                    <Text style={styles.pipelineLabel}>Processing</Text>
                  </View>
                  <View style={[styles.pipelinePill, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.pipelineCount, { color: '#10B981' }]}>
                      {reportData.metrics.completedOrders}
                    </Text>
                    <Text style={styles.pipelineLabel}>Delivered</Text>
                  </View>
                  <View style={[styles.pipelinePill, { backgroundColor: '#FEF2F2' }]}>
                    <Text style={[styles.pipelineCount, { color: '#EF4444' }]}>
                      {reportData.metrics.cancelledOrders}
                    </Text>
                    <Text style={styles.pipelineLabel}>Cancelled</Text>
                  </View>
                </View>
              </View>
            )}

            {/* COMMERCIAL & SALES: 3. Profit & Loss Waterfall Flow */}
            {reportType === 'ProfitLoss' && reportData?.metrics && (
              <View style={styles.pnlWaterfallCard}>
                <Text style={styles.sectionHeaderTitle}>Profit & Loss Revenue Flow</Text>
                <View style={styles.flowRow}>
                  <View style={[styles.flowIconBox, { backgroundColor: '#ECFDF5' }]}>
                    <Icon name="arrow-downward" size={18} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.flowLabel}>TOTAL REVENUE</Text>
                    <Text style={[styles.flowValue, { color: '#10B981' }]}>
                      ₹{Number(reportData.metrics.totalRevenue || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.flowTag, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.flowTagText, { color: '#10B981' }]}>Inflow</Text>
                  </View>
                </View>

                <View style={styles.flowArrowContainer}>
                  <View style={styles.flowDottedLine} />
                  <Icon name="arrow-downward" size={16} color={AppColors.textMuted} />
                </View>

                <View style={styles.flowRow}>
                  <View style={[styles.flowIconBox, { backgroundColor: '#FEF2F2' }]}>
                    <Icon name="arrow-upward" size={18} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.flowLabel}>TOTAL EXPENSES</Text>
                    <Text style={[styles.flowValue, { color: '#EF4444' }]}>
                      ₹{Number(reportData.metrics.totalExpenses || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.flowTag, { backgroundColor: '#FEF2F2' }]}>
                    <Text style={[styles.flowTagText, { color: '#EF4444' }]}>Outflow</Text>
                  </View>
                </View>

                <View style={styles.flowArrowContainer}>
                  <View style={styles.flowDottedLine} />
                  <Icon name="arrow-downward" size={16} color={AppColors.textMuted} />
                </View>

                <View style={[styles.flowRow, styles.flowNetRow]}>
                  <View style={[styles.flowIconBox, { backgroundColor: '#EEECFE' }]}>
                    <Icon name="equalizer" size={18} color={AppColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.flowLabel, { color: AppColors.primary }]}>NET BUSINESS PROFIT</Text>
                    <Text style={[styles.flowValue, { color: AppColors.primary, fontSize: 22 }]}>
                      ₹{Number(reportData.metrics.netProfit || 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.flowTag, { backgroundColor: AppColors.primary }]}>
                    <Text style={[styles.flowTagText, { color: '#FFFFFF' }]}>
                      {reportData.metrics.profitMargin || '0%'} Margin
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Profit & Loss Monthly Comparison */}
            {reportType === 'ProfitLoss' && reportData?.monthlyComparison && (
              <View style={styles.pnlCard}>
                <Text style={styles.sectionHeaderTitle}>Monthly Performance History</Text>
                <View style={styles.pnlRowHeader}>
                  <Text style={[styles.pnlCol, { flex: 1.2, fontWeight: '700' }]}>Month</Text>
                  <Text style={[styles.pnlCol, { color: '#10B981', fontWeight: '700' }]}>Revenue</Text>
                  <Text style={[styles.pnlCol, { color: '#EF4444', fontWeight: '700' }]}>Expenses</Text>
                  <Text style={[styles.pnlCol, { color: AppColors.primary, fontWeight: '700' }]}>Net Profit</Text>
                </View>
                {reportData.monthlyComparison.map((m: any) => (
                  <View key={m.month} style={styles.pnlRow}>
                    <Text style={[styles.pnlCol, { flex: 1.2, fontWeight: '600', color: AppColors.textPrimary }]}>
                      {m.month}
                    </Text>
                    <Text style={styles.pnlCol}>₹{m.revenue.toLocaleString()}</Text>
                    <Text style={styles.pnlCol}>₹{m.expenses.toLocaleString()}</Text>
                    <Text
                      style={[
                        styles.pnlCol,
                        {
                          color: m.profit >= 0 ? '#10B981' : '#EF4444',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      ₹{m.profit.toLocaleString()}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Finance Overview Special Summary */}
            {reportType === 'Finance' && reportData?.summary && (
              <View style={styles.financeCard}>
                <Text style={styles.sectionHeaderTitle}>Consolidated Business Balance Sheet</Text>
                <View style={styles.financeGrid}>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Total Income</Text>
                    <Text style={[styles.financeVal, { color: '#10B981' }]}>
                      ₹{reportData.summary.totalIncome.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Total Expenses</Text>
                    <Text style={[styles.financeVal, { color: '#EF4444' }]}>
                      ₹{reportData.summary.totalExpenses.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Loan Outstanding</Text>
                    <Text style={styles.financeVal}>
                      ₹{reportData.summary.loanOutstanding.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Pending EMI</Text>
                    <Text style={[styles.financeVal, { color: '#F59E0B' }]}>
                      ₹{reportData.summary.emiPending.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.financeItem}>
                    <Text style={styles.financeLabel}>Receivables</Text>
                    <Text style={styles.financeVal}>
                      ₹{reportData.summary.receivables.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.financeItem, { backgroundColor: AppColors.surfaceTint, borderRadius: 12, padding: 8 }]}>
                    <Text style={[styles.financeLabel, { color: AppColors.primary }]}>Net Balance</Text>
                    <Text style={[styles.financeVal, { color: AppColors.primary, fontSize: 18 }]}>
                      ₹{reportData.summary.netBalance.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Search & Filter Bar */}
            <View style={styles.filterSection}>
              <View style={styles.searchBar}>
                <Icon name="search" size={18} color={AppColors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search in report..."
                  placeholderTextColor={AppColors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Icon name="cancel" size={16} color={AppColors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Status Filter Chips */}
              {filterChips.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterChipsRow}
                >
                  {filterChips.map((chip) => {
                    const isActive = statusFilter.toLowerCase() === chip.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={chip}
                        onPress={() => setStatusFilter(chip)}
                        style={[styles.filterChip, isActive && styles.filterChipActive]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            isActive && styles.filterChipTextActive,
                          ]}
                        >
                          {chip}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Data Table */}
            <View style={styles.tableCard}>
              <View style={styles.tableTitleRow}>
                <Text style={styles.tableTitle}>Detailed Records</Text>
                <Text style={styles.tableCount}>
                  Showing {filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'}
                </Text>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Table Headers */}
                  <View style={styles.tableHeaderRow}>
                    {getTableHeaders().map((h, idx) => (
                      <View key={idx} style={[styles.tableCellWrap, { width: idx === 0 ? 110 : 130 }]}>
                        <Text style={styles.tableHeaderCell}>{h}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Table Rows */}
                  {filteredRows.length === 0 ? (
                    <View style={styles.emptyTable}>
                      <Icon name="inbox" size={36} color={AppColors.textMuted} />
                      <Text style={styles.emptyText}>No matching records found for this period</Text>
                    </View>
                  ) : (
                    filteredRows.map((row, rIdx) => {
                      const values = getTableRowValues(row);
                      return (
                        <View
                          key={rIdx}
                          style={[
                            styles.tableDataRow,
                            rIdx % 2 === 1 && { backgroundColor: '#F8FAFC' },
                          ]}
                        >
                          {values.map((v, cIdx) => {
                            const isStatusCol =
                              cIdx === values.length - 1 &&
                              (typeof v === 'string') &&
                              (getTableHeaders()[cIdx] === 'Status');
                            return (
                              <View
                                key={cIdx}
                                style={[styles.tableCellWrap, { width: cIdx === 0 ? 110 : 130 }]}
                              >
                                {isStatusCol ? (
                                  renderStatusBadge(String(v))
                                ) : (
                                  <Text style={styles.tableCellText} numberOfLines={2}>
                                    {String(v ?? '-')}
                                  </Text>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            </View>

            {/* Bottom spacer ensuring scroll clears the bottom action buttons */}
            <View style={{ height: bottomSpacerHeight }} />
          </ScrollView>
        )}

        {/* Bottom Actions Bar (Safe from device navigation touches) */}
        <View style={[styles.bottomBar, { paddingBottom: safeBottomPadding }]}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.csvBtn]}
            onPress={handleExportCsv}
            activeOpacity={0.8}
          >
            <Icon name="file-download" size={18} color="#10B981" />
            <Text style={styles.csvBtnText}>Export CSV</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.statementBtn]}
            onPress={handleExportStatement}
            activeOpacity={0.8}
          >
            <Icon name="print" size={18} color={AppColors.primary} />
            <Text style={styles.statementBtnText}>Statement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.shareBtn]}
            onPress={handleExportCsv}
            activeOpacity={0.8}
          >
            <Icon name="share" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    gap: 10,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  reportCategoryPill: {
    backgroundColor: AppColors.surfaceTint,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reportCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  reportTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  /* Metrics Grid */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.subtle,
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },

  /* Section cards */
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 16,
    ...AppShadows.subtle,
  },

  /* Sales: Payment Dist */
  paymentDistWrap: {
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

  /* Orders: Pipeline */
  orderPipelineGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  pipelinePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  pipelineCount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  pipelineLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },

  /* P&L Waterfall Flow */
  pnlWaterfallCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 16,
    ...AppShadows.subtle,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  flowNetRow: {
    backgroundColor: AppColors.surfaceTint,
    borderWidth: 1,
    borderColor: AppColors.borderAccent,
  },
  flowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.textSecondary,
    letterSpacing: 0.4,
  },
  flowValue: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  flowTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flowTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  flowArrowContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  flowDottedLine: {
    width: 2,
    height: 6,
    backgroundColor: AppColors.border,
    marginBottom: 2,
  },

  /* Monthly comparison */
  pnlCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 16,
    ...AppShadows.subtle,
  },
  pnlRowHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    marginBottom: 8,
  },
  pnlRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderSubtle,
  },
  pnlCol: {
    flex: 1,
    fontSize: 12,
    color: AppColors.textSecondary,
  },

  /* Finance Card */
  financeCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 16,
    ...AppShadows.subtle,
  },
  financeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  financeItem: {
    width: (SCREEN_WIDTH - 64) / 2,
    marginBottom: 6,
  },
  financeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginBottom: 2,
  },
  financeVal: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },

  /* Search Bar & Chips */
  filterSection: {
    marginBottom: 14,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...AppShadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: AppColors.textPrimary,
    padding: 0,
  },
  filterChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  filterChipActive: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  /* Table */
  tableCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    ...AppShadows.card,
  },
  tableTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  tableCount: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textMuted,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  tableCellWrap: {
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell: {
    fontSize: 11.5,
    fontWeight: '700',
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderSubtle,
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 12,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyTable: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.textMuted,
    fontWeight: '500',
  },

  /* Bottom Actions (Safe from device navigation touches) */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: AppColors.surface,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    ...AppShadows.card,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
  },
  csvBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  csvBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
  },
  statementBtn: {
    backgroundColor: AppColors.surfaceTint,
    borderWidth: 1,
    borderColor: AppColors.borderAccent,
  },
  statementBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: AppColors.primary,
  },
  shareBtn: {
    backgroundColor: AppColors.primary,
    ...AppShadows.glow,
  },
  shareBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
