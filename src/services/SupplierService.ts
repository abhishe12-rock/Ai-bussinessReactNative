import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export interface SupplierRecord {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  gstNumber?: string | null;
}

export function supplierFromMap(m: any): SupplierRecord {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone ?? null,
    email: m.email ?? null,
    address: m.address ?? null,
    gstNumber: m.gst_number ?? null,
  };
}

function toMap(s: SupplierRecord) {
  return {
    name: s.name,
    phone: s.phone ?? null,
    email: s.email ?? null,
    address: s.address ?? null,
    gst_number: s.gstNumber ?? null,
  };
}

export class SupplierService {
  private client = supabase;

  async getSuppliers(): Promise<SupplierRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('suppliers')
      .select()
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(supplierFromMap);
  }

  async addSupplier(supplier: SupplierRecord): Promise<SupplierRecord> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('suppliers')
      .insert({ user_id: userId, ...toMap(supplier) })
      .select()
      .single();
    if (error) throw error;
    return supplierFromMap(data);
  }

  async updateSupplier(supplier: SupplierRecord): Promise<void> {
    const { error } = await this.client.from('suppliers').update(toMap(supplier)).eq('id', supplier.id);
    if (error) throw error;
  }

  async deleteSupplier(id: string): Promise<void> {
    const { error } = await this.client.from('suppliers').delete().eq('id', id);
    if (error) throw error;
  }
}