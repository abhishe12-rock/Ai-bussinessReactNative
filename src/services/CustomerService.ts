import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  gstNumber?: string | null;
  photoUrl?: string | null;
}

export function customerFromMap(m: any): CustomerRecord {
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    alternatePhone: m.alternate_phone ?? null,
    email: m.email ?? null,
    address: m.address ?? null,
    city: m.city ?? null,
    gstNumber: m.gst_number ?? null,
    photoUrl: m.photo_url ?? null,
  };
}

function toInsertMap(c: CustomerRecord, userId: string) {
  return {
    user_id: userId,
    name: c.name,
    phone: c.phone,
    alternate_phone: c.alternatePhone ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    city: c.city ?? null,
    gst_number: c.gstNumber ?? null,
    photo_url: c.photoUrl ?? null,
  };
}

function toUpdateMap(c: CustomerRecord) {
  return {
    name: c.name,
    phone: c.phone,
    alternate_phone: c.alternatePhone ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    city: c.city ?? null,
    gst_number: c.gstNumber ?? null,
    photo_url: c.photoUrl ?? null,
    updated_at: new Date().toISOString(),
  };
}

// A local file reference from react-native-image-picker.
export interface LocalImageFile {
  uri: string;
  fileName?: string | null;
  type?: string | null;
}

const PHOTO_BUCKET = 'customer_photos';

export class CustomerService {
  private client = supabase;

  async getCustomers(): Promise<CustomerRecord[]> {
    // Resolves to the employer's id when logged in as an employee, so
    // employees see the business's actual customers instead of an
    // empty list.
    const userId = await EmployeeService.resolveDataOwnerId(this.client);

    const { data, error } = await this.client
      .from('customers')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(customerFromMap);
  }

  async searchCustomers(query: string): Promise<CustomerRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);

    const { data, error } = await this.client
      .from('customers')
      .select()
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(customerFromMap);
  }

  async addCustomer(customer: CustomerRecord): Promise<CustomerRecord> {
    // New customers created by an employee are saved under the
    // EMPLOYER's user_id, so they belong to the shared business data,
    // not to the employee personally.
    const userId = await EmployeeService.resolveDataOwnerId(this.client);

    const { data, error } = await this.client
      .from('customers')
      .insert(toInsertMap(customer, userId))
      .select()
      .single();

    if (error) throw error;
    return customerFromMap(data);
  }

  async updateCustomer(customer: CustomerRecord): Promise<void> {
    const { error } = await this.client
      .from('customers')
      .update(toUpdateMap(customer))
      .eq('id', customer.id);
    if (error) throw error;
  }

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await this.client.from('customers').delete().eq('id', id);
    if (error) throw error;
  }

  async softDeleteCustomer(id: string): Promise<void> {
    const { error } = await this.client
      .from('customers')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  }

  /// Uploads a photo to the customer_photos bucket and returns its
  /// public URL. Call this BEFORE addCustomer/updateCustomer, then put
  /// the returned URL into photoUrl.
  async uploadCustomerPhoto(file: LocalImageFile): Promise<string> {
    // NOTE: storage path uses the raw logged-in user's own id (not
    // resolveDataOwnerId) — this only affects the folder the file is
    // stored under in Supabase Storage, not data visibility.
    const { data: userData, error: userError } = await this.client.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user!.id;

    const extension = (file.fileName ?? file.uri).split('.').pop() ?? 'jpg';
    const fileName = `${Date.now()}.${extension}`;
    const path = `${userId}/${fileName}`;

    const response = await fetch(file.uri);
    const arrayBuffer = await response.arrayBuffer();

    const { error: uploadError } = await this.client.storage
      .from(PHOTO_BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type ?? `image/${extension}` });

    if (uploadError) throw uploadError;

    const { data } = this.client.storage.from(PHOTO_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}