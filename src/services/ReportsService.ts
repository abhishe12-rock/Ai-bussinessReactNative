import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export type DateFilterType =
  | 'Today'
  | 'Yesterday'
  | 'This Week'
  | 'This Month'
  | 'Last Month'
  | 'This Year'
  | 'Custom';

export interface DateRangeBounds {
  start: Date;
  end: Date;
  label: string;
}

export function getDateRangeBounds(
  filter: DateFilterType,
  customStart?: Date,
  customEnd?: Date,
): DateRangeBounds {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (filter) {
    case 'Today':
      return { start: todayStart, end: todayEnd, label: 'Today' };

    case 'Yesterday': {
      const yStart = new Date(todayStart);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(todayEnd);
      yEnd.setDate(yEnd.getDate() - 1);
      return { start: yStart, end: yEnd, label: 'Yesterday' };
    }

    case 'This Week': {
      // Start on Monday
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const wStart = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      return { start: wStart, end: todayEnd, label: 'This Week' };
    }

    case 'This Month': {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start: mStart, end: todayEnd, label: 'This Month' };
    }

    case 'Last Month': {
      const lmStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const lmEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start: lmStart, end: lmEnd, label: 'Last Month' };
    }

    case 'This Year': {
      const yStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { start: yStart, end: todayEnd, label: 'This Year' };
    }

    case 'Custom': {
      const cStart = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
      cStart.setHours(0, 0, 0, 0);
      const cEnd = customEnd ? new Date(customEnd) : new Date();
      cEnd.setHours(23, 59, 59, 999);
      return {
        start: cStart,
        end: cEnd,
        label: `${cStart.toLocaleDateString()} - ${cEnd.toLocaleDateString()}`,
      };
    }
  }
}

export interface DashboardSummaryCards {
  totalSales: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  totalRepairs: number;
  totalCustomers: number;
  totalEmployees: number;
  pendingPayments: number;
  outstandingLoans: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface DashboardChartsData {
  salesTrend: ChartDataPoint[];
  incomeVsExpense: ChartDataPoint[];
  profitTrend: ChartDataPoint[];
  ordersTrend: ChartDataPoint[];
  repairsTrend: ChartDataPoint[];
  paymentDistribution: { method: string; amount: number; percentage: number }[];
}

export interface DashboardData {
  summary: DashboardSummaryCards;
  charts: DashboardChartsData;
}

export const ReportsService = {
  /**
   * Always resolves the employer/business owner ID to enforce strict multi-tenant isolation.
   */
  async getOwnerId(): Promise<string> {
    return await EmployeeService.resolveDataOwnerId(supabase);
  },

  /**
   * Main Reports & Analytics Dashboard Aggregator
   */
  async getDashboardData(bounds: DateRangeBounds): Promise<DashboardData> {
    const ownerId = await this.getOwnerId();
    const startIso = bounds.start.toISOString();
    const endIso = bounds.end.toISOString();

    const [
      salesRes,
      ordersRes,
      incomeRes,
      expenseRes,
      repairsRes,
      customersRes,
      employeesRes,
      loansRes,
      emisRes,
    ] = await Promise.all([
      // Sales in period
      supabase
        .from('sales')
        .select('id, total, paid_amount, payment_method, payment_status, created_at')
        .eq('user_id', ownerId)
        .gte('created_at', startIso)
        .lte('created_at', endIso),

      // Orders in period
      supabase
        .from('orders')
        .select('id, total, paid_amount, status, payment_method, created_at')
        .eq('user_id', ownerId)
        .gte('created_at', startIso)
        .lte('created_at', endIso),

      // Income in period
      supabase
        .from('finance_income')
        .select('id, amount, source_type, created_at')
        .eq('owner_id', ownerId)
        .gte('created_at', startIso)
        .lte('created_at', endIso),

      // Expenses in period
      supabase
        .from('finance_expenses')
        .select('id, amount, category, created_at')
        .eq('owner_id', ownerId)
        .gte('created_at', startIso)
        .lte('created_at', endIso),

      // Repairs in period
      supabase
        .from('repairs')
        .select('id, cost, status, source, created_at')
        .eq('owner_id', ownerId)
        .gte('created_at', startIso)
        .lte('created_at', endIso),

      // Total active customers
      supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', ownerId),

      // Total active employees
      supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId),

      // Loans
      supabase
        .from('loans')
        .select('id, loan_amount')
        .eq('owner_id', ownerId),

      // EMIs
      supabase
        .from('loan_emis')
        .select('id, amount, status')
        .eq('owner_id', ownerId),
    ]);

    const sales = salesRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const income = incomeRes.data ?? [];
    const expenses = expenseRes.data ?? [];
    const repairs = repairsRes.data ?? [];
    const loans = loansRes.data ?? [];
    const emis = emisRes.data ?? [];

    // Summary Totals
    const totalSales = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalIncome = income.length > 0
      ? income.reduce((sum, i) => sum + Number(i.amount || 0), 0)
      : totalSales; // fallback to sales if finance_income wasn't populated
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalIncome - totalExpenses;

    const totalOrders = orders.length;
    const totalRepairs = repairs.length;
    const totalCustomers = customersRes.count ?? 0;
    const totalEmployees = employeesRes.count ?? 0;

    // Pending Payments (Unpaid amount on sales + unpaid on orders)
    const salesPending = sales.reduce((sum, s) => {
      const remaining = Number(s.total || 0) - Number(s.paid_amount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
    const ordersPending = orders.reduce((sum, o) => {
      const remaining = Number(o.total || 0) - Number(o.paid_amount || 0);
      return sum + Math.max(0, remaining);
    }, 0);
    const pendingPayments = salesPending + ordersPending;

    // Outstanding Loans (total pending/overdue EMIs or principal)
    const pendingEmis = emis
      .filter((e) => e.status !== 'PAID')
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalLoanPrincipal = loans.reduce((sum, l) => sum + Number(l.loan_amount || 0), 0);
    const outstandingLoans = pendingEmis > 0 ? pendingEmis : totalLoanPrincipal;

    // Grouping helper for trend charts
    const timeSlots = generateTimeBuckets(bounds);

    const salesTrend: ChartDataPoint[] = timeSlots.map((slot) => {
      const val = sales
        .filter((s) => {
          const d = new Date(s.created_at);
          return d >= slot.start && d <= slot.end;
        })
        .reduce((sum, s) => sum + Number(s.total || 0), 0);
      return { label: slot.label, value: val };
    });

    const incomeVsExpense: ChartDataPoint[] = timeSlots.map((slot) => {
      const inc = income
        .filter((i) => {
          const d = new Date(i.created_at);
          return d >= slot.start && d <= slot.end;
        })
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const exp = expenses
        .filter((e) => {
          const d = new Date(e.created_at);
          return d >= slot.start && d <= slot.end;
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      return { label: slot.label, value: inc, secondaryValue: exp };
    });

    const profitTrend: ChartDataPoint[] = timeSlots.map((slot) => {
      const inc = income
        .filter((i) => {
          const d = new Date(i.created_at);
          return d >= slot.start && d <= slot.end;
        })
        .reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const exp = expenses
        .filter((e) => {
          const d = new Date(e.created_at);
          return d >= slot.start && d <= slot.end;
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);
      return { label: slot.label, value: inc - exp };
    });

    const ordersTrend: ChartDataPoint[] = timeSlots.map((slot) => {
      const count = orders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= slot.start && d <= slot.end;
      }).length;
      return { label: slot.label, value: count };
    });

    const repairsTrend: ChartDataPoint[] = timeSlots.map((slot) => {
      const count = repairs.filter((r) => {
        const d = new Date(r.created_at);
        return d >= slot.start && d <= slot.end;
      }).length;
      return { label: slot.label, value: count };
    });

    // Payment methods distribution
    const methodTotals: Record<string, number> = {
      Cash: 0,
      UPI: 0,
      Card: 0,
      'Bank Transfer': 0,
      Other: 0,
    };
    sales.forEach((s) => {
      const m = s.payment_method || 'Other';
      if (methodTotals[m] !== undefined) {
        methodTotals[m] += Number(s.total || 0);
      } else {
        methodTotals.Other += Number(s.total || 0);
      }
    });
    const totalMethodAmount = Object.values(methodTotals).reduce((a, b) => a + b, 0);
    const paymentDistribution = Object.keys(methodTotals).map((key) => ({
      method: key,
      amount: methodTotals[key],
      percentage: totalMethodAmount > 0 ? Math.round((methodTotals[key] / totalMethodAmount) * 100) : 0,
    }));

    return {
      summary: {
        totalSales,
        totalIncome,
        totalExpenses,
        netProfit,
        totalOrders,
        totalRepairs,
        totalCustomers,
        totalEmployees,
        pendingPayments,
        outstandingLoans,
      },
      charts: {
        salesTrend,
        incomeVsExpense,
        profitTrend,
        ordersTrend,
        repairsTrend,
        paymentDistribution,
      },
    };
  },

  /* ------------------------------------------------------------------ */
  /* 2. SALES REPORT                                                    */
  /* ------------------------------------------------------------------ */
  async getSalesReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .eq('user_id', ownerId)
      .gte('created_at', bounds.start.toISOString())
      .lte('created_at', bounds.end.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;

    const list = sales ?? [];
    const totalSalesAmount = list.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const paidSalesCount = list.filter((s) => s.payment_status?.toLowerCase() === 'paid').length;
    const pendingSalesCount = list.filter((s) => s.payment_status?.toLowerCase() === 'pending' || s.payment_status?.toLowerCase() === 'partial').length;
    const cancelledSalesCount = list.filter((s) => s.payment_status?.toLowerCase() === 'cancelled').length;
    const averageOrderValue = list.length > 0 ? Math.round(totalSalesAmount / list.length) : 0;

    // Payment methods breakdown
    const paymentMethodMap: Record<string, number> = {};
    list.forEach((s) => {
      const m = s.payment_method || 'Other';
      paymentMethodMap[m] = (paymentMethodMap[m] || 0) + Number(s.total || 0);
    });

    const rows = list.map((s) => ({
      id: s.id,
      date: new Date(s.created_at).toLocaleDateString(),
      saleId: s.invoice_number || s.id.substring(0, 8),
      customer: s.customers?.name || 'Walk-in',
      amount: Number(s.total || 0),
      paymentMethod: s.payment_method || 'Cash',
      status: s.payment_status || 'Paid',
    }));

    return {
      metrics: {
        totalSalesAmount,
        numberOfSales: list.length,
        paidSales: paidSalesCount,
        pendingSales: pendingSalesCount,
        cancelledSales: cancelledSalesCount,
        averageOrderValue,
      },
      paymentMethods: paymentMethodMap,
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 3. ORDER REPORT                                                    */
  /* ------------------------------------------------------------------ */
  async getOrderReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, customers(name)')
      .eq('user_id', ownerId)
      .gte('created_at', bounds.start.toISOString())
      .lte('created_at', bounds.end.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;

    const list = orders ?? [];
    const totalOrderValue = list.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const pendingCount = list.filter((o) => o.status === 'pending').length;
    const processingCount = list.filter((o) => o.status === 'processing').length;
    const completedCount = list.filter((o) => o.status === 'delivered').length;
    const cancelledCount = list.filter((o) => o.status === 'cancelled').length;

    const rows = list.map((o) => ({
      id: o.id,
      orderId: o.order_number || o.id.substring(0, 8),
      date: new Date(o.created_at).toLocaleDateString(),
      customer: o.customers?.name || 'Customer',
      amount: Number(o.total || 0),
      paymentMethod: o.payment_method || 'Cash',
      status: o.status || 'pending',
    }));

    return {
      metrics: {
        totalOrders: list.length,
        totalOrderValue,
        pendingOrders: pendingCount,
        processingOrders: processingCount,
        completedOrders: completedCount,
        cancelledOrders: cancelledCount,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 4. INCOME REPORT                                                   */
  /* ------------------------------------------------------------------ */
  async getIncomeReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: income, error } = await supabase
      .from('finance_income')
      .select('*')
      .eq('owner_id', ownerId)
      .gte('created_at', bounds.start.toISOString())
      .lte('created_at', bounds.end.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;

    const list = income ?? [];
    const totalIncome = list.reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const typeMap: Record<string, number> = {};
    list.forEach((i) => {
      const t = i.source_type || 'Other Income';
      typeMap[t] = (typeMap[t] || 0) + Number(i.amount || 0);
    });

    const rows = list.map((i) => ({
      id: i.id,
      date: new Date(i.created_at).toLocaleDateString(),
      incomeId: i.id.substring(0, 8),
      type: i.source_type || 'General',
      customer: i.reference_name || 'Walk-in',
      amount: Number(i.amount || 0),
      description: i.description || '-',
    }));

    return {
      metrics: {
        totalIncome,
        totalEntries: list.length,
        types: typeMap,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 5. EXPENSE REPORT                                                  */
  /* ------------------------------------------------------------------ */
  async getExpenseReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: expenses, error } = await supabase
      .from('finance_expenses')
      .select('*')
      .eq('owner_id', ownerId)
      .gte('created_at', bounds.start.toISOString())
      .lte('created_at', bounds.end.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;

    const list = expenses ?? [];
    const totalExpenses = list.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const avgExpense = list.length > 0 ? Math.round(totalExpenses / list.length) : 0;

    const categoryMap: Record<string, number> = {};
    list.forEach((e) => {
      const c = e.category || 'Other';
      categoryMap[c] = (categoryMap[c] || 0) + Number(e.amount || 0);
    });

    let highestCat = 'None';
    let highestVal = 0;
    Object.entries(categoryMap).forEach(([k, v]) => {
      if (v > highestVal) {
        highestVal = v;
        highestCat = k;
      }
    });

    const rows = list.map((e) => ({
      id: e.id,
      date: new Date(e.created_at).toLocaleDateString(),
      expenseId: e.id.substring(0, 8),
      category: e.category || 'Other',
      vendor: e.reference_name || 'Vendor',
      amount: Number(e.amount || 0),
      description: e.description || '-',
    }));

    return {
      metrics: {
        totalExpenses,
        highestExpenseCategory: highestCat,
        highestExpenseAmount: highestVal,
        averageExpense: avgExpense,
        categories: categoryMap,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 6. PROFIT & LOSS REPORT                                            */
  /* ------------------------------------------------------------------ */
  async getProfitLossReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const [incomeRes, expenseRes, allMonthsIncome, allMonthsExpense] = await Promise.all([
      supabase
        .from('finance_income')
        .select('amount, source_type')
        .eq('owner_id', ownerId)
        .gte('created_at', bounds.start.toISOString())
        .lte('created_at', bounds.end.toISOString()),

      supabase
        .from('finance_expenses')
        .select('amount, category')
        .eq('owner_id', ownerId)
        .gte('created_at', bounds.start.toISOString())
        .lte('created_at', bounds.end.toISOString()),

      // Past 6 months income for monthly comparison
      supabase
        .from('finance_income')
        .select('amount, created_at')
        .eq('owner_id', ownerId)
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),

      // Past 6 months expenses for monthly comparison
      supabase
        .from('finance_expenses')
        .select('amount, created_at')
        .eq('owner_id', ownerId)
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const totalRevenue = (incomeRes.data ?? []).reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalExpenses = (expenseRes.data ?? []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';
    const lossAmount = netProfit < 0 ? Math.abs(netProfit) : 0;

    // Monthly historical comparison
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: { month: string; revenue: number; expenses: number; profit: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = months[d.getMonth()];
      const y = d.getFullYear();
      const m = d.getMonth();

      const mRev = (allMonthsIncome.data ?? [])
        .filter((row) => {
          const rd = new Date(row.created_at);
          return rd.getFullYear() === y && rd.getMonth() === m;
        })
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      const mExp = (allMonthsExpense.data ?? [])
        .filter((row) => {
          const ed = new Date(row.created_at);
          return ed.getFullYear() === y && ed.getMonth() === m;
        })
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      monthlyData.push({
        month: mLabel,
        revenue: mRev,
        expenses: mExp,
        profit: mRev - mExp,
      });
    }

    return {
      metrics: {
        totalRevenue,
        totalExpenses,
        grossProfit: netProfit > 0 ? netProfit : 0,
        netProfit,
        profitMargin: `${profitMargin}%`,
        lossAmount,
      },
      monthlyComparison: monthlyData,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 7. REPAIR REPORT                                                   */
  /* ------------------------------------------------------------------ */
  async getRepairReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: repairs, error } = await supabase
      .from('repairs')
      .select('*, employees(full_name)')
      .eq('owner_id', ownerId)
      .gte('created_at', bounds.start.toISOString())
      .lte('created_at', bounds.end.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;

    const list = repairs ?? [];
    const totalRepairs = list.length;
    const onlineRepairs = list.filter((r) => r.source === 'ONLINE').length;
    const offlineRepairs = list.filter((r) => r.source === 'OFFLINE' || !r.source).length;
    const completedRepairs = list.filter((r) => r.status === 'COMPLETED').length;
    const pendingRepairs = list.filter((r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length;
    const cancelledRepairs = list.filter((r) => r.status === 'REJECTED' || r.status === 'CANCELLED').length;
    const totalRepairRevenue = list
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + Number(r.cost || 0), 0);

    const rows = list.map((r) => ({
      id: r.id,
      repairId: r.repair_number || r.id.substring(0, 8),
      date: new Date(r.created_at).toLocaleDateString(),
      customer: r.customer_name || 'Customer',
      device: r.device || 'Device',
      type: r.source || 'OFFLINE',
      employee: r.employees?.full_name || 'Unassigned',
      amount: Number(r.cost || 0),
      status: r.status || 'PENDING',
    }));

    return {
      metrics: {
        totalRepairs,
        onlineRepairs,
        offlineRepairs,
        completedRepairs,
        pendingRepairs,
        cancelledRepairs,
        totalRepairRevenue,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 8. EMPLOYEE REPORT                                                 */
  /* ------------------------------------------------------------------ */
  async getEmployeeReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const [empRes, attRes, repRes, _salesRes] = await Promise.all([
      supabase.from('employees').select('*, departments(name)').eq('owner_id', ownerId),
      supabase
        .from('attendance')
        .select('*')
        .gte('attendance_date', bounds.start.toISOString().split('T')[0])
        .lte('attendance_date', bounds.end.toISOString().split('T')[0]),
      supabase.from('repairs').select('assigned_to, status, cost').eq('owner_id', ownerId),
      supabase.from('sales').select('user_id, total').eq('user_id', ownerId),
    ]);

    const employees = empRes.data ?? [];
    const attendance = attRes.data ?? [];
    const repairs = repRes.data ?? [];

    const rows = employees.map((emp) => {
      const empAtt = attendance.filter((a) => a.employee_id === emp.id);
      const present = empAtt.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const absent = empAtt.filter((a) => a.status === 'ABSENT').length;
      const leave = empAtt.filter((a) => a.status === 'LEAVE').length;

      const empRepairs = repairs.filter((r) => r.assigned_to === emp.id && r.status === 'COMPLETED');
      const repairCount = empRepairs.length;

      return {
        id: emp.id,
        name: emp.full_name,
        code: emp.employee_code || '-',
        department: emp.departments?.name || 'General',
        role: emp.designation || 'Staff',
        joiningDate: emp.joining_date ? new Date(emp.joining_date).toLocaleDateString() : '-',
        status: emp.status || 'ACTIVE',
        presentDays: present,
        absentDays: absent,
        leaveDays: leave,
        repairsCompleted: repairCount,
        basicSalary: Number(emp.basic_salary || 0),
      };
    });

    return {
      metrics: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === 'ACTIVE').length,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 9. ATTENDANCE REPORT                                               */
  /* ------------------------------------------------------------------ */
  async getAttendanceReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('*, employees!inner(full_name, owner_id)')
      .eq('employees.owner_id', ownerId)
      .gte('attendance_date', bounds.start.toISOString().split('T')[0])
      .lte('attendance_date', bounds.end.toISOString().split('T')[0])
      .order('attendance_date', { ascending: false });
    if (error) throw error;

    const list = attendance ?? [];
    const presentCount = list.filter((a) => a.status === 'PRESENT').length;
    const absentCount = list.filter((a) => a.status === 'ABSENT').length;
    const lateCount = list.filter((a) => a.status === 'LATE').length;
    const leaveCount = list.filter((a) => a.status === 'LEAVE').length;

    const rows = list.map((a) => {
      let hours = '8 hrs';
      if (a.check_in && a.check_out) {
        const diffMs = new Date(a.check_out).getTime() - new Date(a.check_in).getTime();
        const diffHrs = (diffMs / (1000 * 60 * 60)).toFixed(1);
        hours = `${diffHrs} hrs`;
      }
      return {
        id: a.id,
        employee: (a.employees as any)?.full_name || 'Staff',
        date: a.attendance_date,
        checkIn: a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        checkOut: a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        hours,
        status: a.status || 'PRESENT',
      };
    });

    return {
      metrics: {
        totalRecords: list.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        onLeave: leaveCount,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 10. LEAVE REPORT                                                   */
  /* ------------------------------------------------------------------ */
  async getLeaveReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: leaves, error } = await supabase
      .from('leave_requests')
      .select('*, employees!inner(full_name, owner_id), leave_types(name)')
      .eq('employees.owner_id', ownerId)
      .gte('start_date', bounds.start.toISOString().split('T')[0])
      .lte('start_date', bounds.end.toISOString().split('T')[0])
      .order('created_at', { ascending: false });
    if (error) throw error;

    const list = leaves ?? [];
    const pendingCount = list.filter((l) => l.status === 'PENDING').length;
    const approvedCount = list.filter((l) => l.status === 'APPROVED').length;
    const rejectedCount = list.filter((l) => l.status === 'REJECTED').length;

    const rows = list.map((l) => {
      const s = new Date(l.start_date);
      const e = new Date(l.end_date);
      const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return {
        id: l.id,
        employee: (l.employees as any)?.full_name || 'Staff',
        leaveType: l.leave_types?.name || 'General Leave',
        from: l.start_date,
        to: l.end_date,
        days,
        status: l.status || 'PENDING',
      };
    });

    return {
      metrics: {
        totalRequests: list.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalDays: rows.reduce((sum, r) => sum + r.days, 0),
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 11. PAYROLL REPORT                                                 */
  /* ------------------------------------------------------------------ */
  async getPayrollReport() {
    const ownerId = await this.getOwnerId();
    const { data: payroll, error } = await supabase
      .from('payroll')
      .select('*, employees(full_name)')
      .eq('business_id', ownerId)
      .order('payroll_month', { ascending: false });
    if (error) throw error;

    const list = payroll ?? [];
    const totalPayroll = list.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
    const paidSalary = list.filter((p) => p.payment_status === 'PAID').reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
    const pendingSalary = list.filter((p) => p.payment_status !== 'PAID').reduce((sum, p) => sum + Number(p.net_salary || 0), 0);
    const totalDeductions = list.reduce((sum, p) => sum + Number(p.deductions || 0), 0);
    const totalBonuses = list.reduce((sum, p) => sum + Number(p.bonus || 0), 0);

    const rows = list.map((p) => ({
      id: p.id,
      employee: p.employees?.full_name || 'Employee',
      month: p.payroll_month,
      basicSalary: Number(p.basic_salary || 0),
      allowances: Number(p.allowances || 0),
      bonus: Number(p.bonus || 0),
      deductions: Number(p.deductions || 0),
      netSalary: Number(p.net_salary || 0),
      status: p.payment_status || 'PENDING',
      paymentDate: p.payment_date || '-',
    }));

    return {
      metrics: {
        totalPayroll,
        paidSalary,
        pendingSalary,
        totalDeductions,
        totalBonuses,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 12. CUSTOMER REPORT                                                */
  /* ------------------------------------------------------------------ */
  async getCustomerReport() {
    const ownerId = await this.getOwnerId();
    const [custRes, salesRes, repairsRes] = await Promise.all([
      supabase.from('customers').select('*').eq('user_id', ownerId).order('name'),
      supabase.from('sales').select('customer_id, total, paid_amount, created_at').eq('user_id', ownerId),
      supabase.from('repairs').select('customer_id, cost, status').eq('owner_id', ownerId),
    ]);

    const customers = custRes.data ?? [];
    const sales = salesRes.data ?? [];
    const repairs = repairsRes.data ?? [];

    let activeCount = 0;
    let customersWithPendingCount = 0;

    const rows = customers.map((c) => {
      const cSales = sales.filter((s) => s.customer_id === c.id);
      const cRepairs = repairs.filter((r) => r.customer_id === c.id);

      const purchases = cSales.reduce((sum, s) => sum + Number(s.total || 0), 0);
      const paid = cSales.reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
      const outstanding = Math.max(0, purchases - paid);

      if (cSales.length > 0 || cRepairs.length > 0) activeCount++;
      if (outstanding > 0) customersWithPendingCount++;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone || '-',
        orders: cSales.length,
        repairs: cRepairs.length,
        purchases,
        paid,
        outstanding,
      };
    });

    return {
      metrics: {
        totalCustomers: customers.length,
        newCustomers: customers.length,
        activeCustomers: activeCount,
        inactiveCustomers: customers.length - activeCount,
        customersWithPendingPayments: customersWithPendingCount,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 13. INVENTORY REPORT                                               */
  /* ------------------------------------------------------------------ */
  async getInventoryReport() {
    const ownerId = await this.getOwnerId();
    const { data: products, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('user_id', ownerId)
      .order('name');
    if (error) throw error;

    const list = products ?? [];
    const totalProducts = list.length;
    const totalStock = list.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
    const lowStockCount = list.filter((p) => p.quantity > 0 && p.quantity <= (p.minimum_stock ?? 5)).length;
    const outOfStockCount = list.filter((p) => p.quantity <= 0).length;
    const stockValue = list.reduce((sum, p) => sum + Number(p.purchase_price || 0) * Number(p.quantity || 0), 0);

    const rows = list.map((p) => {
      let status = 'Good';
      if (p.quantity <= 0) status = 'Out of Stock';
      else if (p.quantity <= (p.minimum_stock ?? 5)) status = 'Low Stock';

      return {
        id: p.id,
        name: p.name,
        category: p.categories?.name || 'General',
        stock: Number(p.quantity || 0),
        purchasePrice: Number(p.purchase_price || 0),
        sellingPrice: Number(p.selling_price || 0),
        status,
      };
    });

    return {
      metrics: {
        totalProducts,
        totalStock,
        lowStockProducts: lowStockCount,
        outOfStockProducts: outOfStockCount,
        stockValue,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 14. FINANCE REPORT                                                 */
  /* ------------------------------------------------------------------ */
  async getFinanceReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const [incRes, expRes, _loanRes, emiRes, salesRes] = await Promise.all([
      supabase.from('finance_income').select('amount').eq('owner_id', ownerId).gte('created_at', bounds.start.toISOString()).lte('created_at', bounds.end.toISOString()),
      supabase.from('finance_expenses').select('amount').eq('owner_id', ownerId).gte('created_at', bounds.start.toISOString()).lte('created_at', bounds.end.toISOString()),
      supabase.from('loans').select('loan_amount').eq('owner_id', ownerId),
      supabase.from('loan_emis').select('amount, status').eq('owner_id', ownerId),
      supabase.from('sales').select('total, paid_amount').eq('user_id', ownerId),
    ]);

    const totalIncome = (incRes.data ?? []).reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalExpenses = (expRes.data ?? []).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const loanOutstanding = (emiRes.data ?? []).filter((e) => e.status !== 'PAID').reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const emiPending = (emiRes.data ?? []).filter((e) => e.status === 'PENDING').reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netBalance = totalIncome - totalExpenses;

    const receivables = (salesRes.data ?? []).reduce((sum, s) => sum + Math.max(0, Number(s.total || 0) - Number(s.paid_amount || 0)), 0);

    return {
      summary: {
        totalIncome,
        totalExpenses,
        loanOutstanding,
        emiPending,
        netBalance,
        receivables,
        payables: loanOutstanding,
      },
    };
  },

  /* ------------------------------------------------------------------ */
  /* 15. LOAN REPORT                                                    */
  /* ------------------------------------------------------------------ */
  async getLoanReport() {
    const ownerId = await this.getOwnerId();
    const [loansRes, emisRes] = await Promise.all([
      supabase.from('loans').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
      supabase.from('loan_emis').select('*').eq('owner_id', ownerId),
    ]);

    const loans = loansRes.data ?? [];
    const emis = emisRes.data ?? [];

    const totalLoans = loans.length;
    const totalBorrowed = loans.reduce((sum, l) => sum + Number(l.loan_amount || 0), 0);

    const rows = loans.map((l) => {
      const lEmis = emis.filter((e) => e.loan_id === l.id);
      const paid = lEmis.filter((e) => e.status === 'PAID').reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const totalEmiAmount = lEmis.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const outstanding = Math.max(0, totalEmiAmount - paid);
      const status = outstanding <= 0 && lEmis.length > 0 ? 'Completed' : 'Active';

      return {
        id: l.id,
        name: l.name,
        principal: Number(l.loan_amount || 0),
        interestRate: `${l.interest_rate}%`,
        durationMonths: l.duration_months,
        paid,
        outstanding,
        status,
      };
    });

    const activeCount = rows.filter((r) => r.status === 'Active').length;
    const completedCount = rows.filter((r) => r.status === 'Completed').length;
    const totalRepaid = rows.reduce((sum, r) => sum + r.paid, 0);
    const totalOutstanding = rows.reduce((sum, r) => sum + r.outstanding, 0);

    return {
      metrics: {
        totalLoans,
        activeLoans: activeCount,
        completedLoans: completedCount,
        totalBorrowed,
        totalRepaid,
        outstandingLoan: totalOutstanding,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 16. EMI REPORT                                                     */
  /* ------------------------------------------------------------------ */
  async getEmiReport() {
    const ownerId = await this.getOwnerId();
    const { data: emis, error } = await supabase
      .from('loan_emis')
      .select('*, loans(name)')
      .eq('owner_id', ownerId)
      .order('due_date', { ascending: true });
    if (error) throw error;

    const list = emis ?? [];
    const nowIso = new Date().toISOString().split('T')[0];

    const paidCount = list.filter((e) => e.status === 'PAID').length;
    const pendingCount = list.filter((e) => e.status === 'PENDING' && e.due_date >= nowIso).length;
    const overdueCount = list.filter((e) => e.status !== 'PAID' && e.due_date < nowIso).length;
    const upcomingCount = list.filter((e) => e.status !== 'PAID' && e.due_date >= nowIso).length;

    const rows = list.map((e, index) => {
      let calcStatus = e.status;
      if (calcStatus !== 'PAID' && e.due_date < nowIso) calcStatus = 'OVERDUE';
      return {
        id: e.id,
        loanName: e.loans?.name || 'Business Loan',
        emiNo: `#${index + 1}`,
        dueDate: e.due_date,
        amount: Number(e.amount || 0),
        paidDate: e.paid_date || '-',
        status: calcStatus,
      };
    });

    return {
      metrics: {
        totalEmi: list.length,
        paidEmi: paidCount,
        pendingEmi: pendingCount,
        overdueEmi: overdueCount,
        upcomingEmi: upcomingCount,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 17. LEDGER REPORT                                                  */
  /* ------------------------------------------------------------------ */
  async getLedgerReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const [incRes, expRes] = await Promise.all([
      supabase
        .from('finance_income')
        .select('*')
        .eq('owner_id', ownerId)
        .gte('created_at', bounds.start.toISOString())
        .lte('created_at', bounds.end.toISOString()),
      supabase
        .from('finance_expenses')
        .select('*')
        .eq('owner_id', ownerId)
        .gte('created_at', bounds.start.toISOString())
        .lte('created_at', bounds.end.toISOString()),
    ]);

    const combined: any[] = [];
    (incRes.data ?? []).forEach((i) => {
      combined.push({
        id: i.id,
        date: new Date(i.created_at),
        account: i.reference_name || 'Cash Account',
        type: 'CREDIT',
        debit: 0,
        credit: Number(i.amount || 0),
        reference: i.source_type || 'Income',
      });
    });

    (expRes.data ?? []).forEach((e) => {
      combined.push({
        id: e.id,
        date: new Date(e.created_at),
        account: e.reference_name || 'Vendor Account',
        type: 'DEBIT',
        debit: Number(e.amount || 0),
        credit: 0,
        reference: e.category || 'Expense',
      });
    });

    combined.sort((a, b) => a.date.getTime() - b.date.getTime());

    let runningBalance = 0;
    const rows = combined.map((entry) => {
      runningBalance += entry.credit - entry.debit;
      return {
        id: entry.id,
        date: entry.date.toLocaleDateString(),
        account: entry.account,
        debit: entry.debit,
        credit: entry.credit,
        balance: runningBalance,
        reference: entry.reference,
      };
    });

    return {
      metrics: {
        totalEntries: rows.length,
        netBalance: runningBalance,
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 18. TRANSACTION REPORT                                             */
  /* ------------------------------------------------------------------ */
  async getTransactionReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: txs, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('owner_id', ownerId)
      .gte('created_at', bounds.start.toISOString())
      .lte('created_at', bounds.end.toISOString())
      .order('created_at', { ascending: false });
    if (error) throw error;

    const list = txs ?? [];
    let runningBalance = 0;

    const rows = list.map((t) => {
      const isIncome = t.type === 'INCOME';
      const credit = isIncome ? Number(t.amount || 0) : 0;
      const debit = !isIncome ? Number(t.amount || 0) : 0;
      runningBalance += credit - debit;

      return {
        id: t.id,
        txId: t.id.substring(0, 8),
        date: new Date(t.created_at).toLocaleDateString(),
        type: t.source_type || (isIncome ? 'Income' : 'Expense'),
        description: t.description || t.reference_name || '-',
        credit,
        debit,
        balance: runningBalance,
      };
    });

    return {
      metrics: {
        totalTransactions: list.length,
        totalCredit: rows.reduce((s, r) => s + r.credit, 0),
        totalDebit: rows.reduce((s, r) => s + r.debit, 0),
      },
      rows,
    };
  },

  /* ------------------------------------------------------------------ */
  /* 19. ACTIVITY / AUDIT REPORT                                        */
  /* ------------------------------------------------------------------ */
  async getActivityReport(bounds: DateRangeBounds) {
    const ownerId = await this.getOwnerId();
    const { data: logs, error } = await supabase
      .from('employee_activity_logs')
      .select('*, employees!inner(full_name, owner_id)')
      .eq('employees.owner_id', ownerId)
      .gte('created_at', bounds.start.toISOString())
      .lte('created_at', bounds.end.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    const list = logs ?? [];
    const rows = list.map((log) => ({
      id: log.id,
      dateTime: new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      user: (log.employees as any)?.full_name || 'System User',
      module: log.module || 'System',
      action: log.action || 'Updated',
      details: log.description || '-',
    }));

    return {
      metrics: {
        totalActivities: list.length,
      },
      rows,
    };
  },
};

/**
 * Generate 6 discrete time intervals across the date range for trend charts.
 */
function generateTimeBuckets(bounds: DateRangeBounds): { label: string; start: Date; end: Date }[] {
  const totalMs = bounds.end.getTime() - bounds.start.getTime();
  const bucketCount = 6;
  const bucketMs = Math.max(1, Math.floor(totalMs / bucketCount));
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const buckets: { label: string; start: Date; end: Date }[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const bStart = new Date(bounds.start.getTime() + i * bucketMs);
    const bEnd = new Date(i === bucketCount - 1 ? bounds.end.getTime() : bounds.start.getTime() + (i + 1) * bucketMs - 1);

    let label = '';
    if (totalMs <= 24 * 60 * 60 * 1000) {
      // Within 24 hours: hour label
      label = `${bStart.getHours()}:00`;
    } else if (totalMs <= 7 * 24 * 60 * 60 * 1000) {
      // Within week: Day label
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      label = days[bStart.getDay()];
    } else if (totalMs <= 60 * 24 * 60 * 60 * 1000) {
      // Within 2 months: day + month
      label = `${bStart.getDate()} ${months[bStart.getMonth()]}`;
    } else {
      // Yearly: Month label
      label = months[bStart.getMonth()];
    }

    buckets.push({ label, start: bStart, end: bEnd });
  }

  return buckets;
}
