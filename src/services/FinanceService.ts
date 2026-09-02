import { supabase } from '../lib/supabase.ts';
import { EmployeeService } from './EmployeeService';
/* ------------------------------------------------------------------ */
/* Record types                                                        */
/* ------------------------------------------------------------------ */

export interface IncomeRecord {
  id: string;
  sourceType: string;
  amount: number;
  description?: string | null;
  referenceName?: string | null;
  createdAt: Date;
}

export interface ExpenseRecord {
  id: string;
  sourceType: string;
  amount: number;
  category: string;
  description?: string | null;
  referenceName?: string | null;
  createdAt: Date;
}

export interface LoanRecord {
  id: string;
  name: string;
  loanAmount: number;
  interestRate: number;
  startDate: Date;
  durationMonths: number;
}

export interface EmiRecord {
  id: string;
  loanId: string;
  loanName?: string | null;
  dueDate: Date;
  amount: number;
  status: string;
  paidDate?: Date | null;
}

export interface TransactionRecord {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  sourceType: string;
  amount: number;
  description?: string | null;
  referenceName?: string | null;
  createdAt: Date;
}

/* ------------------------------------------------------------------ */
/* Row -> Record mappers                                               */
/* ------------------------------------------------------------------ */

function mapIncome(m: any): IncomeRecord {
  return {
    id: m.id,
    sourceType: m.source_type,
    amount: Number(m.amount),
    description: m.description ?? null,
    referenceName: m.reference_name ?? null,
    createdAt: new Date(m.created_at),
  };
}

function mapExpense(m: any): ExpenseRecord {
  return {
    id: m.id,
    sourceType: m.source_type,
    amount: Number(m.amount),
    category: m.category,
    description: m.description ?? null,
    referenceName: m.reference_name ?? null,
    createdAt: new Date(m.created_at),
  };
}

function mapLoan(m: any): LoanRecord {
  return {
    id: m.id,
    name: m.name,
    loanAmount: Number(m.loan_amount),
    interestRate: Number(m.interest_rate),
    startDate: new Date(m.start_date),
    durationMonths: m.duration_months,
  };
}

function mapEmi(m: any): EmiRecord {
  return {
    id: m.id,
    loanId: m.loan_id,
    loanName: m.loans?.name ?? null,
    dueDate: new Date(m.due_date),
    amount: Number(m.amount),
    status: m.status,
    paidDate: m.paid_date ? new Date(m.paid_date) : null,
  };
}

function mapTransaction(m: any): TransactionRecord {
  return {
    id: m.id,
    type: m.type,
    sourceType: m.source_type,
    amount: Number(m.amount),
    description: m.description ?? null,
    referenceName: m.reference_name ?? null,
    createdAt: new Date(m.created_at),
  };
}

/* ------------------------------------------------------------------ */
/* Service                                                              */
/* ------------------------------------------------------------------ */

export const FinanceService = {
  async getIncome(from?: Date, to?: Date): Promise<IncomeRecord[]> {
    const ownerId = await EmployeeService.resolveDataOwnerId(supabase);
    let query = supabase.from('finance_income').select().eq('owner_id', ownerId);
    if (from) query = query.gte('created_at', from.toISOString());
    if (to) query = query.lte('created_at', to.toISOString());
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapIncome);
  },

  async getExpenses(from?: Date, to?: Date): Promise<ExpenseRecord[]> {
    const ownerId = await EmployeeService.resolveDataOwnerId(supabase);
    let query = supabase.from('finance_expenses').select().eq('owner_id', ownerId);
    if (from) query = query.gte('created_at', from.toISOString());
    if (to) query = query.lte('created_at', to.toISOString());
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapExpense);
  },

  /** Net balance + income/expense totals for the current calendar month. */
  async getMonthSummary(): Promise<{ income: number; expenses: number; net: number }> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const [income, expenses] = await Promise.all([
      this.getIncome(start),
      this.getExpenses(start),
    ]);

    const totalIncome = income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return { income: totalIncome, expenses: totalExpense, net: totalIncome - totalExpense };
  },

  async getLoans(): Promise<LoanRecord[]> {
    const ownerId = await EmployeeService.resolveDataOwnerId(supabase);
    const { data, error } = await supabase
      .from('loans')
      .select()
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapLoan);
  },

  /**
   * Adds a loan and automatically generates every EMI row for its whole
   * duration via the generate_loan_emis Postgres function.
   */
  async addLoan(params: {
    name: string;
    loanAmount: number;
    interestRate: number;
    startDate: Date;
    durationMonths: number;
  }): Promise<void> {
    const ownerId = await EmployeeService.resolveDataOwnerId(supabase);

    const { data: inserted, error } = await supabase
      .from('loans')
      .insert({
        name: params.name,
        loan_amount: params.loanAmount,
        interest_rate: params.interestRate,
        start_date: params.startDate.toISOString().split('T')[0],
        duration_months: params.durationMonths,
        owner_id: ownerId,
      })
      .select()
      .single();
    if (error) throw error;

    const { error: rpcError } = await supabase.rpc('generate_loan_emis', {
      p_loan_id: inserted.id,
    });
    if (rpcError) throw rpcError;
  },

  async getAllEmis(statusFilter?: string): Promise<EmiRecord[]> {
    const ownerId = await EmployeeService.resolveDataOwnerId(supabase);
    let query = supabase.from('loan_emis').select('*, loans(name)').eq('owner_id', ownerId);
    if (statusFilter && statusFilter !== 'All') {
      query = query.eq('status', statusFilter);
    }
    const { data, error } = await query.order('due_date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapEmi);
  },

  async getEmisForLoan(loanId: string): Promise<EmiRecord[]> {
    const { data, error } = await supabase
      .from('loan_emis')
      .select('*, loans(name)')
      .eq('loan_id', loanId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(mapEmi);
  },

  /**
   * Marks one EMI as paid — the DB trigger automatically creates the
   * matching Expense entry, no extra step needed here.
   */
  async markEmiPaid(emiId: string): Promise<void> {
    const { error } = await supabase
      .from('loan_emis')
      .update({
        status: 'PAID',
        paid_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', emiId);
    if (error) throw error;
  },

  async getTransactions(params?: {
    from?: Date;
    to?: Date;
    typeFilter?: string;
  }): Promise<TransactionRecord[]> {
    const ownerId = await EmployeeService.resolveDataOwnerId(supabase);
    let query = supabase.from('finance_transactions').select().eq('owner_id', ownerId);
    if (params?.from) query = query.gte('created_at', params.from.toISOString());
    if (params?.to) query = query.lte('created_at', params.to.toISOString());
    if (params?.typeFilter && params.typeFilter !== 'All') {
      query = query.eq('type', params.typeFilter);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapTransaction);
  },

  /** Ledger: all income tied to one customer. */
  async getLedgerForCustomer(customerId: string): Promise<IncomeRecord[]> {
    const { data, error } = await supabase
      .from('finance_income')
      .select()
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapIncome);
  },

  /** Ledger: all expenses tied to one supplier. */
  async getLedgerForSupplier(supplierId: string): Promise<ExpenseRecord[]> {
    const { data, error } = await supabase
      .from('finance_expenses')
      .select()
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapExpense);
  },
};