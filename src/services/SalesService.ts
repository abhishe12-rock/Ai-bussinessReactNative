import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export interface SaleCartItem {
  productId?: string | null;
  productName: string;
  price: number;
  quantity: number;
  availableStock?: number | null;
}

export function saleCartItemToJson(i: SaleCartItem) {
  return {
    product_id: i.productId ?? null,
    product_name: i.productName,
    price: i.price,
    quantity: i.quantity,
  };
}

export interface SaleRecord {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  invoiceNumber: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  paymentStatus: string;
  notes?: string | null;
  createdAt: Date;
}

export function saleRemaining(s: SaleRecord): number {
  return Math.max(0, s.total - s.paidAmount);
}

export function saleFromMap(m: any): SaleRecord {
  return {
    id: m.id,
    customerId: m.customer_id ?? null,
    customerName: m.customers ? m.customers.name : null,
    invoiceNumber: m.invoice_number,
    subtotal: Number(m.subtotal),
    discountPercent: Number(m.discount_percent),
    discountAmount: Number(m.discount_amount),
    taxPercent: Number(m.tax_percent),
    taxAmount: Number(m.tax_amount),
    total: Number(m.total),
    paymentMethod: m.payment_method,
    paidAmount: Number(m.paid_amount),
    paymentStatus: m.payment_status,
    notes: m.notes ?? null,
    createdAt: new Date(m.created_at),
  };
}

export interface SaleItemRecord {
  id: string;
  productId?: string | null;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export function saleItemFromMap(m: any): SaleItemRecord {
  return {
    id: m.id,
    productId: m.product_id ?? null,
    productName: m.product_name,
    price: Number(m.price),
    quantity: Number(m.quantity),
    total: Number(m.total),
  };
}

export interface PaymentRecord {
  id: string;
  amount: number;
  paymentMethod: string;
  paidAt: Date;
}

export function paymentFromMap(m: any): PaymentRecord {
  return {
    id: m.id,
    amount: Number(m.amount),
    paymentMethod: m.payment_method,
    paidAt: new Date(m.paid_at),
  };
}

export class SalesService {
  private client = supabase;

  /// Calls the atomic `complete_sale` Postgres function. Validates
  /// stock for every item BEFORE creating anything — if any item
  /// doesn't have enough stock, the whole sale is rejected.
  async completeSale({
    customerId, items, subtotal, discountPercent, discountAmount,
    taxPercent, taxAmount, total, paymentMethod, paidAmount,
  }: {
    customerId: string; items: SaleCartItem[]; subtotal: number;
    discountPercent: number; discountAmount: number; taxPercent: number;
    taxAmount: number; total: number; paymentMethod: string; paidAmount: number;
  }): Promise<string> {
    const { data, error } = await this.client.rpc('complete_sale', {
      p_customer_id: customerId,
      p_items: items.map(saleCartItemToJson),
      p_subtotal: subtotal,
      p_discount_percent: discountPercent,
      p_discount_amount: discountAmount,
      p_tax_percent: taxPercent,
      p_tax_amount: taxAmount,
      p_total: total,
      p_payment_method: paymentMethod,
      p_paid_amount: paidAmount,
    });
    if (error) throw error;
    return data as string;
  }

  async getAllSales(): Promise<SaleRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('sales')
      .select('*, customers(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(saleFromMap);
  }

  async getSalesForCustomer(customerId: string): Promise<SaleRecord[]> {
    const { data, error } = await this.client
      .from('sales')
      .select('*, customers(name)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(saleFromMap);
  }

  async getSaleItems(saleId: string): Promise<SaleItemRecord[]> {
    const { data, error } = await this.client.from('sale_items').select().eq('sale_id', saleId).order('created_at');
    if (error) throw error;
    return (data ?? []).map(saleItemFromMap);
  }

  async getPaymentsForSale(saleId: string): Promise<PaymentRecord[]> {
    const { data, error } = await this.client.from('payments').select().eq('sale_id', saleId).order('paid_at');
    if (error) throw error;
    return (data ?? []).map(paymentFromMap);
  }

  /// Records a payment via the atomic `record_sale_payment` function —
  /// payment insert + sale status update happen together or not at
  /// all, and it rejects payments that would exceed the outstanding
  /// amount.
  async recordPayment({ saleId, amount, paymentMethod }: { saleId: string; amount: number; paymentMethod: string }): Promise<void> {
    const { error } = await this.client.rpc('record_sale_payment', {
      p_sale_id: saleId,
      p_amount: amount,
      p_payment_method: paymentMethod,
    });
    if (error) throw error;
  }

  /// Processes a return via the atomic `process_sale_return` function.
  /// Tracks how much of a sale_item has already been returned, so the
  /// same invoice can't be returned twice for more than was sold.
  async processReturn({
    saleId, saleItemId, returnQty, reason,
  }: { saleId: string; saleItemId: string; returnQty: number; reason: string }): Promise<string> {
    const { data, error } = await this.client.rpc('process_sale_return', {
      p_sale_id: saleId,
      p_sale_item_id: saleItemId,
      p_return_quantity: returnQty,
      p_reason: reason,
    });
    if (error) throw error;
    return data as string;
  }

  /// How many units of a sale_item are still eligible for return.
  async getReturnableQuantity(saleItemId: string, soldQuantity: number): Promise<number> {
    const { data, error } = await this.client.from('return_items').select('quantity').eq('sale_item_id', saleItemId);
    if (error) throw error;
    const alreadyReturned = (data ?? []).reduce((sum: number, row: any) => sum + Number(row.quantity), 0);
    return soldQuantity - alreadyReturned;
  }

  sumTotalForDate(sales: SaleRecord[], date: Date): number {
    return sales
      .filter((s) => s.createdAt.getFullYear() === date.getFullYear() && s.createdAt.getMonth() === date.getMonth() && s.createdAt.getDate() === date.getDate())
      .reduce((sum, s) => sum + s.total, 0);
  }

  countForDate(sales: SaleRecord[], date: Date): number {
    return sales.filter((s) => s.createdAt.getFullYear() === date.getFullYear() && s.createdAt.getMonth() === date.getMonth() && s.createdAt.getDate() === date.getDate()).length;
  }
}