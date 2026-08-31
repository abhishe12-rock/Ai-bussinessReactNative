import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export interface PurchaseCartItem {
  productId?: string | null;
  productName: string;
  purchasePrice: number;
  quantity: number;
  currentStock?: number | null;
}

export function purchaseCartItemTotal(i: PurchaseCartItem): number {
  return i.purchasePrice * i.quantity;
}

export function purchaseCartItemToJson(i: PurchaseCartItem) {
  return {
    product_id: i.productId ?? null,
    product_name: i.productName,
    quantity: i.quantity,
    purchase_price: i.purchasePrice,
  };
}

export interface PurchaseRecord {
  id: string;
  supplierId?: string | null;
  supplierName?: string | null;
  purchaseNumber: string;
  purchaseDate: Date;
  notes?: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paidAmount: number;
  paymentStatus: string;
  status: string; // Pending / Partially Received / Received
  createdAt: Date;
}

export function purchaseRemaining(p: PurchaseRecord): number {
  return Math.max(0, p.total - p.paidAmount);
}

export function purchaseFromMap(m: any): PurchaseRecord {
  return {
    id: m.id,
    supplierId: m.supplier_id ?? null,
    supplierName: m.suppliers ? m.suppliers.name : null,
    purchaseNumber: m.purchase_number,
    purchaseDate: new Date(m.purchase_date),
    notes: m.notes ?? null,
    subtotal: Number(m.subtotal),
    discountAmount: Number(m.discount_amount),
    taxAmount: Number(m.tax_amount),
    total: Number(m.total),
    paymentMethod: m.payment_method,
    paidAmount: Number(m.paid_amount),
    paymentStatus: m.payment_status,
    status: m.status,
    createdAt: new Date(m.created_at),
  };
}

export interface PurchaseItemRecord {
  id: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  receivedQuantity: number;
  purchasePrice: number;
  total: number;
}

export function purchaseItemPending(i: PurchaseItemRecord): number {
  return i.quantity - i.receivedQuantity;
}
export function purchaseItemFullyReceived(i: PurchaseItemRecord): boolean {
  return i.receivedQuantity >= i.quantity;
}

export function purchaseItemFromMap(m: any): PurchaseItemRecord {
  return {
    id: m.id,
    productId: m.product_id ?? null,
    productName: m.product_name,
    quantity: Number(m.quantity),
    receivedQuantity: Number(m.received_quantity),
    purchasePrice: Number(m.purchase_price),
    total: Number(m.total),
  };
}

export class PurchaseService {
  private client = supabase;

  /// Atomically creates the purchase order + its line items. Does NOT
  /// touch product stock — stock only changes on receiving.
  async createPurchaseOrder({
    supplierId, purchaseDate, notes, items, subtotal, discountAmount,
    taxAmount, total, paymentMethod, paidAmount,
  }: {
    supplierId: string; purchaseDate: Date; notes?: string | null;
    items: PurchaseCartItem[]; subtotal: number; discountAmount: number;
    taxAmount: number; total: number; paymentMethod: string; paidAmount: number;
  }): Promise<string> {
    const { data, error } = await this.client.rpc('create_purchase_order', {
      p_supplier_id: supplierId,
      p_purchase_date: purchaseDate.toISOString().split('T')[0],
      p_notes: notes ?? null,
      p_items: items.map(purchaseCartItemToJson),
      p_subtotal: subtotal,
      p_discount_amount: discountAmount,
      p_tax_amount: taxAmount,
      p_total: total,
      p_payment_method: paymentMethod,
      p_paid_amount: paidAmount,
    });
    if (error) throw error;
    return data as string;
  }

  async getAllPurchases(): Promise<PurchaseRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('purchases')
      .select('*, suppliers(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(purchaseFromMap);
  }

  async getPurchaseItems(purchaseId: string): Promise<PurchaseItemRecord[]> {
    const { data, error } = await this.client.from('purchase_items').select().eq('purchase_id', purchaseId).order('created_at');
    if (error) throw error;
    return (data ?? []).map(purchaseItemFromMap);
  }

  /// Atomically receives stock for one purchase line item — validates
  /// the quantity, bumps product stock, and recalculates the
  /// purchase's overall status (Pending/Partially Received/Received).
  async receiveStock({ purchaseItemId, receiveQuantity }: { purchaseItemId: string; receiveQuantity: number }): Promise<void> {
    const { error } = await this.client.rpc('receive_purchase_stock', {
      p_purchase_item_id: purchaseItemId,
      p_receive_quantity: receiveQuantity,
    });
    if (error) throw error;
  }

  sumTotalForMonth(purchases: PurchaseRecord[], date: Date): number {
    return purchases
      .filter((p) => p.createdAt.getFullYear() === date.getFullYear() && p.createdAt.getMonth() === date.getMonth())
      .reduce((sum, p) => sum + p.total, 0);
  }

  countByStatus(purchases: PurchaseRecord[], status: string): number {
    return purchases.filter((p) => p.status === status).length;
  }
}