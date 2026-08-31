import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export type OrderStatus = 'pending' | 'processing' | 'delivered' | 'cancelled';

export function orderStatusFromString(s: string): OrderStatus {
  switch (s) {
    case 'Processing': return 'processing';
    case 'Delivered': return 'delivered';
    case 'Cancelled': return 'cancelled';
    default: return 'pending';
  }
}

export function orderStatusToString(s: OrderStatus): string {
  switch (s) {
    case 'pending': return 'Pending';
    case 'processing': return 'Processing';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
  }
}

export interface OrderRecord {
  id: string;
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paidAmount: number;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  cancellationReason?: string | null;
  createdAt: Date;
}

export function orderRemaining(o: OrderRecord): number {
  return Math.max(0, o.total - o.paidAmount);
}

export function orderFromMap(m: any): OrderRecord {
  return {
    id: m.id,
    customerId: m.customer_id ?? null,
    customerName: m.customers ? m.customers.name : null,
    customerPhone: m.customers ? m.customers.phone : null,
    orderNumber: m.order_number,
    status: orderStatusFromString(m.status),
    subtotal: Number(m.subtotal),
    discountAmount: Number(m.discount_amount),
    taxAmount: Number(m.tax_amount),
    total: Number(m.total),
    paymentMethod: m.payment_method,
    paymentStatus: m.payment_status,
    paidAmount: Number(m.paid_amount),
    deliveryAddress: m.delivery_address ?? null,
    deliveryCity: m.delivery_city ?? null,
    deliveryState: m.delivery_state ?? null,
    cancellationReason: m.cancellation_reason ?? null,
    createdAt: new Date(m.created_at),
  };
}

export interface OrderItemRecord {
  id: string;
  productId?: string | null;
  productName: string;
  price: number;
  quantity: number;
  total: number;
}

export function orderItemFromMap(m: any): OrderItemRecord {
  return {
    id: m.id,
    productId: m.product_id ?? null,
    productName: m.product_name,
    price: Number(m.price),
    quantity: Number(m.quantity),
    total: Number(m.total),
  };
}

export class OrderService {
  private client = supabase;

  async getAllOrders(): Promise<OrderRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('orders')
      .select('*, customers(name, phone)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(orderFromMap);
  }

  async getOrderItems(orderId: string): Promise<OrderItemRecord[]> {
    const { data, error } = await this.client.from('order_items').select().eq('order_id', orderId).order('id');
    if (error) throw error;
    return (data ?? []).map(orderItemFromMap);
  }

  /// Updates order status via the atomic function. Stock is only
  /// reduced automatically when moving to 'Delivered'. Pass `reason`
  /// when cancelling.
  async updateOrderStatus({ orderId, newStatus, reason }: { orderId: string; newStatus: OrderStatus; reason?: string }): Promise<void> {
    const { error } = await this.client.rpc('update_order_status', {
      p_order_id: orderId,
      p_new_status: orderStatusToString(newStatus),
      p_reason: reason ?? null,
    });
    if (error) throw error;
  }

  countByStatus(orders: OrderRecord[], status: OrderStatus): number {
    return orders.filter((o) => o.status === status).length;
  }
}