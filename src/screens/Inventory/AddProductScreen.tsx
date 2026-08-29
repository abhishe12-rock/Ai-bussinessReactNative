import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image,
  ActivityIndicator, Modal, Pressable, Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import Icon from '@react-native-vector-icons/material-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ProductService, ProductRecord, LocalImageFile } from '../../services/ProductService';
import { CategoryService, CategoryRecord } from '../../services/CategoryService';
import { BrandService, BrandRecord } from '../../services/BrandService';
import { SupplierService, SupplierRecord } from '../../services/SupplierService';
import { AppColors } from '../theme/AppColors';

const productService = new ProductService();
const categoryService = new CategoryService();
const brandService = new BrandService();
const supplierService = new SupplierService();

const MAX_IMAGES = 5;

export default function AddProductScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [name, setName] = useState('');
  const [imei, setImei] = useState('');
  const [barcode, setBarcode] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [qty, setQty] = useState('');
  const [minStock, setMinStock] = useState('5');
  const [warranty, setWarranty] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState<Asset[]>([]);

  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brandId, setBrandId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, b, s] = await Promise.all([
          categoryService.getCategories(), brandService.getBrands(), supplierService.getSuppliers(),
        ]);
        setCategories(c); setBrands(b); setSuppliers(s);
      } catch (e: any) {
        Alert.alert('Failed to load categories/brands/suppliers', String(e.message ?? e));
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, []);

  const pickFromCamera = async () => {
    if (images.length >= MAX_IMAGES) return;
    const result = await launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 1200 });
    if (!result.didCancel && result.assets?.length) setImages((prev) => [...prev, result.assets![0]]);
  };

  const pickFromGallery = async () => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1200, selectionLimit: remaining });
    if (!result.didCancel && result.assets?.length) setImages((prev) => [...prev, ...result.assets!.slice(0, remaining)]);
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('Product name is required');
    if (!sellingPrice.trim()) return Alert.alert('Selling price is required');

    setSaving(true);
    try {
      let imageUrls: string[] = [];
      if (images.length > 0) {
        const files: LocalImageFile[] = images.map((a) => ({ uri: a.uri!, fileName: a.fileName, type: a.type }));
        imageUrls = await productService.uploadProductImages(files);
      }

      const product: ProductRecord = {
        id: '',
        name: name.trim(),
        categoryId, brandId, supplierId,
        purchasePrice: parseFloat(purchasePrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        quantity: parseInt(qty, 10) || 0,
        minimumStock: parseInt(minStock, 10) || 5,
        imei: imei.trim() || null,
        barcode: barcode.trim() || null,
        warrantyMonths: warranty.trim() ? parseInt(warranty, 10) : null,
        description: desc.trim() || null,
        imageUrls,
      };

      await productService.addProduct(product);
      Alert.alert('Product added successfully');
      onSaved?.();
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed to save product', String(e.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  if (loadingLookups) {
    return <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>;
  }

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add product</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel text="Product images" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {images.map((img, i) => (
            <View key={i} style={styles.imageThumbWrap}>
              <Image source={{ uri: img.uri }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}>
                <Icon name="close" color="#fff" size={14} />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <TouchableOpacity style={styles.addImageBtn} onPress={() => setSheetOpen(true)}>
              <Icon name="add-a-photo" color={AppColors.textMuted} size={22} />
              <Text style={styles.addImageText}>Add photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <SectionLabel text="Basic info" />
        <Field icon="shopping-bag" label="Product name *" value={name} onChangeText={setName} />
        <Dropdown label="Category" icon="category" value={categoryId} items={categories} onChange={setCategoryId} />
        <Dropdown label="Brand" icon="local-offer" value={brandId} items={brands} onChange={setBrandId} />
        <Dropdown label="Supplier" icon="local-shipping" value={supplierId} items={suppliers} onChange={setSupplierId} />
        <Field icon="confirmation-number" label="IMEI (optional)" value={imei} onChangeText={setImei} />

        <SectionLabel text="Identification" />
        <Field icon="qr-code-scanner" label="Barcode" value={barcode} onChangeText={setBarcode} />

        <SectionLabel text="Pricing & stock" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field icon="currency-rupee" label="Purchase price" value={purchasePrice} onChangeText={setPurchasePrice} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field icon="sell" label="Selling price *" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" /></View>
        </View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field icon="numbers" label="Quantity" value={qty} onChangeText={setQty} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field icon="warning-amber" label="Minimum stock" value={minStock} onChangeText={setMinStock} keyboardType="numeric" /></View>
        </View>

        <SectionLabel text="Other details" />
        <Field icon="verified" label="Warranty (months)" value={warranty} onChangeText={setWarranty} keyboardType="numeric" />
        <Field icon="notes" label="Description" value={desc} onChangeText={setDesc} multiline />

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save product</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{images.length}/{MAX_IMAGES} photos added</Text>
            <View style={styles.sheetRow}>
              <SheetOption icon="photo-camera" label="Camera" onPress={() => { setSheetOpen(false); pickFromCamera(); }} />
              <SheetOption icon="photo-library" label="Gallery (multiple)" onPress={() => { setSheetOpen(false); pickFromGallery(); }} />
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function SheetOption({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sheetOption} onPress={onPress}>
      <Icon name={icon} color={AppColors.primary} size={24} />
      <Text style={styles.sheetOptionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({ icon, label, value, onChangeText, keyboardType, multiline }: {
  icon: any; label: string; value: string; onChangeText: (v: string) => void; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldBox}>
      <Icon name={icon} color={AppColors.textMuted} size={20} />
      <TextInput
        style={[styles.fieldInput, multiline && { height: 70, textAlignVertical: 'top' }]}
        placeholder={label} placeholderTextColor={AppColors.textMuted}
        value={value} onChangeText={onChangeText} keyboardType={keyboardType} multiline={multiline}
      />
    </View>
  );
}

function Dropdown({ label, icon, value, items, onChange }: {
  label: string; icon: any; value: string | null; items: { id: string; name: string }[]; onChange: (v: string | null) => void;
}) {
  return (
    <View style={styles.fieldBox}>
      <Icon name={icon} color={AppColors.textMuted} size={20} />
      <View style={{ flex: 1 }}>
        <Picker
          selectedValue={value ?? ''}
          onValueChange={(v) => onChange(v === '' ? null : String(v))}
          enabled={items.length > 0}
        >
          <Picker.Item label={items.length === 0 ? `${label} (none added yet)` : label} value="" />
          {items.map((item) => <Picker.Item key={item.id} label={item.name} value={item.id} />)}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginBottom: 12 },
  fieldInput: { flex: 1, paddingVertical: 14, marginLeft: 10, color: AppColors.textPrimary, fontSize: 14 },
  imageThumbWrap: { marginRight: 10 },
  imageThumb: { width: 90, height: 90, borderRadius: 14 },
  removeImageBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.54)', borderRadius: 20, padding: 3 },
  addImageBtn: { width: 90, height: 90, borderRadius: 14, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center', justifyContent: 'center' },
  addImageText: { color: AppColors.textMuted, fontSize: 10.5, marginTop: 4 },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', gap: 10 },
  sheetOption: { flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: AppColors.background, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border },
  sheetOptionLabel: { color: AppColors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
});