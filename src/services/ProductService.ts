import { supabase } from '../lib/supabase';
import { EmployeeService } from './EmployeeService';

export interface ProductRecord {
  id: string;
  name: string;
  categoryId?: string | null;
  categoryName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
  minimumStock: number;
  imei?: string | null;
  barcode?: string | null;
  warrantyMonths?: number | null;
  description?: string | null;
  imageUrls: string[];
}

export function productFromMap(m: any): ProductRecord {
  return {
    id: m.id,
    name: m.name,
    categoryId: m.category_id ?? null,
    categoryName: m.categories ? m.categories.name : null,
    brandId: m.brand_id ?? null,
    brandName: m.brands ? m.brands.name : null,
    supplierId: m.supplier_id ?? null,
    supplierName: m.suppliers ? m.suppliers.name : null,
    purchasePrice: Number(m.purchase_price),
    sellingPrice: Number(m.selling_price),
    quantity: Number(m.quantity),
    minimumStock: Number(m.minimum_stock ?? 5),
    imei: m.imei ?? null,
    barcode: m.barcode ?? null,
    warrantyMonths: m.warranty_months ?? null,
    description: m.description ?? null,
    imageUrls: m.image_urls ? [...m.image_urls] : [],
  };
}

function toInsertMap(p: ProductRecord, userId: string) {
  return {
    user_id: userId,
    name: p.name,
    category_id: p.categoryId ?? null,
    brand_id: p.brandId ?? null,
    supplier_id: p.supplierId ?? null,
    purchase_price: p.purchasePrice,
    selling_price: p.sellingPrice,
    quantity: p.quantity,
    minimum_stock: p.minimumStock,
    imei: p.imei ?? null,
    barcode: p.barcode ?? null,
    warranty_months: p.warrantyMonths ?? null,
    description: p.description ?? null,
    image_urls: p.imageUrls,
  };
}

function toUpdateMap(p: ProductRecord) {
  return {
    name: p.name,
    category_id: p.categoryId ?? null,
    brand_id: p.brandId ?? null,
    supplier_id: p.supplierId ?? null,
    purchase_price: p.purchasePrice,
    selling_price: p.sellingPrice,
    quantity: p.quantity,
    minimum_stock: p.minimumStock,
    imei: p.imei ?? null,
    barcode: p.barcode ?? null,
    warranty_months: p.warrantyMonths ?? null,
    description: p.description ?? null,
    image_urls: p.imageUrls,
    updated_at: new Date().toISOString(),
  };
}

export interface LocalImageFile {
  uri: string;
  fileName?: string | null;
  type?: string | null;
}

const SELECT_WITH_JOINS = '*, categories(name), brands(name), suppliers(name)';
const IMAGE_BUCKET = 'product-images';

export class ProductService {
  private client = supabase;

  async getProducts(): Promise<ProductRecord[]> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('products')
      .select(SELECT_WITH_JOINS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(productFromMap);
  }

  async getLowStockProducts(): Promise<ProductRecord[]> {
    const all = await this.getProducts();
    return all.filter((p) => p.quantity < p.minimumStock);
  }

  /// Used by the Barcode scanner — matches the product's `barcode` field.
  async findByBarcode(barcode: string): Promise<ProductRecord | null> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('products')
      .select(SELECT_WITH_JOINS)
      .eq('user_id', userId)
      .eq('barcode', barcode)
      .maybeSingle();
    if (error) throw error;
    return data ? productFromMap(data) : null;
  }

  /// Used by the QR scanner — matches the product's primary key `id`.
  /// QR codes generated in this app encode the product's `id`.
  async findById(id: string): Promise<ProductRecord | null> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('products')
      .select(SELECT_WITH_JOINS)
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? productFromMap(data) : null;
  }

  async addProduct(product: ProductRecord): Promise<ProductRecord> {
    const userId = await EmployeeService.resolveDataOwnerId(this.client);
    const { data, error } = await this.client
      .from('products')
      .insert(toInsertMap(product, userId))
      .select(SELECT_WITH_JOINS)
      .single();
    if (error) throw error;
    return productFromMap(data);
  }

  async updateProduct(product: ProductRecord): Promise<void> {
    const { error } = await this.client.from('products').update(toUpdateMap(product)).eq('id', product.id);
    if (error) throw error;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.client.from('products').delete().eq('id', id);
    if (error) throw error;
  }

  async decrementStock(productId: string, soldQty: number): Promise<void> {
    const { data: current, error: fetchError } = await this.client
      .from('products')
      .select('quantity')
      .eq('id', productId)
      .single();
    if (fetchError) throw fetchError;

    const newQty = Number(current.quantity) - soldQty;
    const { error } = await this.client
      .from('products')
      .update({ quantity: newQty < 0 ? 0 : newQty })
      .eq('id', productId);
    if (error) throw error;
  }

  /// Uploads multiple product photos to the product-images bucket.
  /// Returns their public URLs in the same order as `files`.
  async uploadProductImages(files: LocalImageFile[]): Promise<string[]> {
    const { data: userData, error: userError } = await this.client.auth.getUser();
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error('User is not logged in');

    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      let extension = (file.fileName ?? file.uri).split('.').pop()?.toLowerCase() ?? 'jpeg';
      if (extension === 'jpg') extension = 'jpeg';

      const fileName = `${Date.now()}_${i}.${extension}`;
      // NOTE: storage path uses the raw logged-in user's own id — this
      // only affects the storage folder, not data visibility.
      const storagePath = `${user.id}/${fileName}`;

      const response = await fetch(file.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await this.client.storage
        .from(IMAGE_BUCKET)
        .upload(storagePath, arrayBuffer, { contentType: `image/${extension}`, upsert: false });

      if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

      const { data } = this.client.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);
      if (!data.publicUrl) throw new Error('Failed to generate image URL');

      urls.push(data.publicUrl);
    }

    return urls;
  }
}