import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { SupplierService, SupplierRecord } from '../../services/SupplierService';
import { AppColors } from '../theme/AppColors';

const service = new SupplierService();

export default function EditSupplierScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const supplier: SupplierRecord = route.params.supplier;
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [name, setName] = useState(supplier.name);
  const [phone, setPhone] = useState(supplier.phone ?? '');
  const [email, setEmail] = useState(supplier.email ?? '');
  const [address, setAddress] = useState(supplier.address ?? '');
  const [gst, setGst] = useState(supplier.gstNumber ?? '');
  const [saving, setSaving] = useState(false);

  const confirmDelete = () => {
    Alert.alert('Remove supplier?', `${supplier.name} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        setSaving(true);
        try {
          await service.deleteSupplier(supplier.id);
          onSaved?.();
          navigation.goBack();
        } catch (e: any) {
          setSaving(false);
          Alert.alert('Delete failed', String(e.message ?? e));
        }
      } },
    ]);
  };

  const update = async () => {
    setSaving(true);
    try {
      await service.updateSupplier({
        id: supplier.id, name: name.trim(), phone: phone.trim() || null,
        email: email.trim() || null, address: address.trim() || null, gstNumber: gst.trim() || null,
      });
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit supplier</Text>
        <TouchableOpacity onPress={saving ? undefined : confirmDelete}>
          <Icon name="delete-outline" color={AppColors.danger} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconCircle}>
          <Icon name="local-shipping" color={AppColors.info} size={30} />
        </View>

        <Field icon="storefront" label="Supplier name *" value={name} onChangeText={setName} />
        <Field icon="call" label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field icon="mail-outline" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field icon="location-on" label="Address" value={address} onChangeText={setAddress} multiline />
        <Field icon="receipt-long" label="GST number" value={gst} onChangeText={setGst} />

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={update} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ icon, label, value, onChangeText, keyboardType, multiline }: {
  icon: any; label: string; value: string; onChangeText: (v: string) => void; keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldBox}>
      <Icon name={icon} color={AppColors.textMuted} size={20} />
      <TextInput
        style={[styles.fieldInput, multiline && { height: 60, textAlignVertical: 'top' }]}
        placeholder={label} placeholderTextColor={AppColors.textMuted}
        value={value} onChangeText={onChangeText} keyboardType={keyboardType} multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: AppColors.infoSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginBottom: 12 },
  fieldInput: { flex: 1, paddingVertical: 14, marginLeft: 10, color: AppColors.textPrimary, fontSize: 14 },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});