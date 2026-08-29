import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export interface BrandRecord {
  id: string;
  name: string;
}

export function brandFromMap(m: any): BrandRecord {
  return { id: m.id, name: m.name };
}

export class BrandService {
  private client = supabase;

  async getBrands(): Promise<BrandRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('brands')
      .select()
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(brandFromMap);
  }

  async addBrand(brand: BrandRecord): Promise<BrandRecord> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('brands')
      .insert({ user_id: userId, name: brand.name })
      .select()
      .single();
    if (error) throw error;
    return brandFromMap(data);
  }

  async updateBrand(brand: BrandRecord): Promise<void> {
    const { error } = await this.client.from('brands').update({ name: brand.name }).eq('id', brand.id);
    if (error) throw error;
  }

  async deleteBrand(id: string): Promise<void> {
    const { error } = await this.client.from('brands').delete().eq('id', id);
    if (error) throw error;
  }
}