import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Modal, Pressable, Alert } from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ProductService, ProductRecord, LocalImageFile } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const service = new ProductService();
const MAX_IMAGES = 5;

export default function EditProductScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const product: ProductRecord = route.params.product;
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [name, setName] = useState(product.name);
  const [sellingPrice, setSellingPrice] = useState(product.sellingPrice.toFixed(0));
  const [qty, setQty] = useState(String(product.quantity));
  const [minStock, setMinStock] = useState(String(product.minimumStock));
  const [warranty, setWarranty] = useState(product.warrantyMonths?.toString() ?? '');
  const [existingUrls, setExistingUrls] = useState<string[]>([...product.imageUrls]);
  const [newImages, setNewImages] = useState<Asset[]>([]);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const totalCount = existingUrls.length + newImages.length;

  const pickFromCamera = async () => {
    if (totalCount >= MAX_IMAGES) return;
    const result = await launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 1200 });
    if (!result.didCancel && result.assets?.length) setNewImages((prev) => [...prev, result.assets![0]]);
  };

  const pickFromGallery = async () => {
    const remaining = MAX_IMAGES - totalCount;
    if (remaining <= 0) return;
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1200, selectionLimit: remaining });
    if (!result.didCancel && result.assets?.length) setNewImages((prev) => [...prev, ...result.assets!.slice(0, remaining)]);
  };

  const confirmDelete = () => {
    Alert.alert('Delete product?', `${product.name} will be permanently removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          await service.deleteProduct(product.id);
          onSaved?.();
          navigation.goBack();
        } catch (e: any) {
          setSaving(false);
          Alert.alert('Delete failed', String(e.message ?? e));
        }
      } },
    ]);
  };

  const save = async () => {
    setSaving(true);
    try {
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        const files: LocalImageFile[] = newImages.map((a) => ({ uri: a.uri!, fileName: a.fileName, type: a.type }));
        uploadedUrls = await service.uploadProductImages(files);
      }

      const updated: ProductRecord = {
        ...product,
        name: name.trim(),
        sellingPrice: parseFloat(sellingPrice) || product.sellingPrice,
        quantity: parseInt(qty, 10) || product.quantity,
        minimumStock: parseInt(minStock, 10) || product.minimumStock,
        warrantyMonths: warranty.trim() ? parseInt(warranty, 10) : null,
        imageUrls: [...existingUrls, ...uploadedUrls],
      };

      await service.updateProduct(updated);
      onSaved?.();
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Update failed', String(e.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Product</Text>
        </View>
        <TouchableOpacity onPress={saving ? undefined : confirmDelete}>
          <Icon name="delete-outline" color={AppColors.danger} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Product images</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {existingUrls.map((url, i) => (
            <View key={`e-${i}`} style={styles.imageThumbWrap}>
              <Image source={{ uri: url }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setExistingUrls((prev) => prev.filter((_, idx) => idx !== i))}>
                <Icon name="close" color="#fff" size={14} />
              </TouchableOpacity>
            </View>
          ))}
          {newImages.map((img, i) => (
            <View key={`n-${i}`} style={styles.imageThumbWrap}>
              <Image source={{ uri: img.uri }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => setNewImages((prev) => prev.filter((_, idx) => idx !== i))}>
                <Icon name="close" color="#fff" size={14} />
              </TouchableOpacity>
            </View>
          ))}
          {totalCount < MAX_IMAGES && (
            <TouchableOpacity style={styles.addImageBtn} onPress={() => setSheetOpen(true)}>
              <Icon name="add-a-photo" color={AppColors.textMuted} size={22} />
              <Text style={styles.addImageText}>Add photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <Field icon="shopping-bag" label="Product name" value={name} onChangeText={setName} />
        <Field icon="currency-rupee" label="Selling price" value={sellingPrice} onChangeText={setSellingPrice} keyboardType="numeric" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field icon="numbers" label="Quantity" value={qty} onChangeText={setQty} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field icon="warning-amber" label="Min stock" value={minStock} onChangeText={setMinStock} keyboardType="numeric" /></View>
        </View>
        <Field icon="verified" label="Warranty (months)" value={warranty} onChangeText={setWarranty} keyboardType="numeric" />

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{totalCount}/{MAX_IMAGES} photos</Text>
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

function SheetOption({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.sheetOption} onPress={onPress}>
      <Icon name={icon} color={AppColors.primary} size={24} />
      <Text style={styles.sheetOptionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({ icon, label, value, onChangeText, keyboardType }: {
  icon: any; label: string; value: string; onChangeText: (v: string) => void; keyboardType?: any;
}) {
  return (
    <View style={styles.fieldBox}>
      <Icon name={icon} color={AppColors.textMuted} size={20} />
      <TextInput style={styles.fieldInput} placeholder={label} placeholderTextColor={AppColors.textMuted} value={value} onChangeText={onChangeText} keyboardType={keyboardType} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { marginLeft: -6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  content: { padding: 16, paddingBottom: 84 },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 12, marginBottom: 12 },
  fieldInput: { flex: 1, paddingVertical: 13, marginLeft: 10, color: AppColors.textPrimary, fontSize: 13.5 },
  imageThumbWrap: { marginRight: 10 },
  imageThumb: { width: 80, height: 80, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 20, padding: 4 },
  addImageBtn: { width: 80, height: 80, borderRadius: 12, backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center', justifyContent: 'center' },
  addImageText: { color: AppColors.textMuted, fontSize: 10.5, marginTop: 4 },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 40, borderWidth: 1, borderColor: AppColors.border },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', gap: 10 },
  sheetOption: { flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: AppColors.background, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border },
  sheetOptionLabel: { color: AppColors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
});