import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, ActivityIndicator, Modal, Pressable, Alert,
} from 'react-native';
import { launchCamera, launchImageLibrary, Asset } from 'react-native-image-picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { CustomerService, CustomerRecord, LocalImageFile } from '../../services/CustomerService';
import { AppColors } from '../theme/AppColors';

const service = new CustomerService();

export default function EditCustomerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const customer: CustomerRecord = route.params.customer;
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [altPhone, setAltPhone] = useState(customer.alternatePhone ?? '');
  const [email, setEmail] = useState(customer.email ?? '');
  const [address, setAddress] = useState(customer.address ?? '');
  const [city, setCity] = useState(customer.city ?? '');
  const [gst, setGst] = useState(customer.gstNumber ?? '');
  const [photo, setPhoto] = useState<Asset | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(customer.photoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const initials = customer.name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const pickImage = async (source: 'camera' | 'gallery') => {
    const result = source === 'camera'
      ? await launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 800 })
      : await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 800 });

    if (result.didCancel || !result.assets?.length) return;
    setPhoto(result.assets[0]);
    setExistingPhotoUrl(null);
  };

  const confirmDelete = () => {
    Alert.alert('Delete customer?', `Are you sure you want to delete ${customer.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await service.deleteCustomer(customer.id);
            onSaved?.();
            navigation.goBack();
          } catch (e: any) {
            setSaving(false);
            Alert.alert('Delete failed', String(e.message ?? e));
          }
        },
      },
    ]);
  };

  const update = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Name and mobile number are required');
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | null = existingPhotoUrl;
      if (photo?.uri) {
        const file: LocalImageFile = { uri: photo.uri, fileName: photo.fileName, type: photo.type };
        photoUrl = await service.uploadCustomerPhoto(file);
      }

      const updated: CustomerRecord = {
        id: customer.id,
        name: name.trim(),
        phone: phone.trim(),
        alternatePhone: altPhone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        gstNumber: gst.trim() || null,
        photoUrl,
      };

      await service.updateCustomer(updated);
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
        <Text style={styles.headerTitle}>Edit customer</Text>
        <TouchableOpacity onPress={saving ? undefined : confirmDelete}>
          <Icon name="delete-outline" color={AppColors.danger} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.photoWrap} onPress={() => setSheetOpen(true)}>
          <View style={styles.photoCircle}>
            {photo?.uri ? (
              <Image source={{ uri: photo.uri }} style={styles.photoImg} />
            ) : existingPhotoUrl ? (
              <Image source={{ uri: existingPhotoUrl }} style={styles.photoImg} />
            ) : (
              <Text style={styles.initialsText}>{initials}</Text>
            )}
          </View>
          <View style={styles.editBadge}>
            <Icon name="edit" color="#fff" size={14} />
          </View>
        </TouchableOpacity>

        <View style={{ height: 22 }} />

        <SectionLabel text="Basic details" />
        <Field icon="person-outline" label="Customer name *" value={name} onChangeText={setName} />
        <Field icon="call" label="Mobile number *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field icon="phone-forwarded" label="Alternate number" value={altPhone} onChangeText={setAltPhone} keyboardType="phone-pad" />
        <Field icon="mail-outline" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />

        <SectionLabel text="Address" />
        <Field icon="location-on" label="Address" value={address} onChangeText={setAddress} multiline />
        <Field icon="location-city" label="City" value={city} onChangeText={setCity} />

        <SectionLabel text="Business (optional)" />
        <Field icon="receipt-long" label="GST number" value={gst} onChangeText={setGst} />

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={update} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Update customer</Text>}
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Customer photo</Text>
            <View style={styles.sheetRow}>
              <PhotoOption icon="photo-camera" label="Camera" onPress={() => { setSheetOpen(false); pickImage('camera'); }} />
              <PhotoOption icon="image" label="Gallery" onPress={() => { setSheetOpen(false); pickImage('gallery'); }} />
            </View>
            {(photo || existingPhotoUrl) && (
              <TouchableOpacity style={styles.removeRow} onPress={() => { setPhoto(null); setExistingPhotoUrl(null); setSheetOpen(false); }}>
                <Icon name="delete-outline" color={AppColors.danger} size={18} />
                <Text style={styles.removeText}>Remove photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function PhotoOption({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.photoOption} onPress={onPress}>
      <Icon name={icon} color={AppColors.primary} size={24} />
      <Text style={styles.photoOptionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({
  icon, label, value, onChangeText, keyboardType, multiline,
}: {
  icon: any; label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldBox}>
      <Icon name={icon} color={AppColors.textMuted} size={20} />
      <TextInput
        style={[styles.fieldInput, multiline && { height: 60, textAlignVertical: 'top' }]}
        placeholder={label}
        placeholderTextColor={AppColors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: AppColors.textPrimary },
  content: { padding: 16, paddingBottom: 40 },
  photoWrap: { alignSelf: 'center', marginTop: 4 },
  photoCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImg: { width: 88, height: 88, borderRadius: 44 },
  initialsText: { color: AppColors.primary, fontSize: 24, fontWeight: '700' },
  editBadge: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: AppColors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: AppColors.background },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600', marginBottom: 10, marginTop: 8 },
  fieldBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginBottom: 12,
  },
  fieldInput: { flex: 1, paddingVertical: 14, marginLeft: 10, color: AppColors.textPrimary, fontSize: 14 },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 24 },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', gap: 10 },
  photoOption: { flex: 1, alignItems: 'center', paddingVertical: 16, backgroundColor: AppColors.background, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border },
  photoOptionLabel: { color: AppColors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 6 },
  removeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 8 },
  removeText: { color: AppColors.danger, fontSize: 13 },
});