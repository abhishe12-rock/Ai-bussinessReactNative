import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export interface CategoryRecord {
  id: string;
  name: string;
  description?: string | null;
}

export function categoryFromMap(m: any): CategoryRecord {
  return { id: m.id, name: m.name, description: m.description ?? null };
}

export class CategoryService {
  private client = supabase;

  async getCategories(): Promise<CategoryRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('categories')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(categoryFromMap);
  }

  async addCategory(category: CategoryRecord): Promise<CategoryRecord> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('categories')
      .insert({ user_id: userId, name: category.name, description: category.description ?? null })
      .select()
      .single();
    if (error) throw error;
    return categoryFromMap(data);
  }

  async updateCategory(category: CategoryRecord): Promise<void> {
    const { error } = await this.client
      .from('categories')
      .update({ name: category.name, description: category.description ?? null })
      .eq('id', category.id);
    if (error) throw error;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.client.from('categories').delete().eq('id', id);
    if (error) throw error;
  }
}