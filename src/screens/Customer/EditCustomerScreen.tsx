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
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Customer</Text>
        <TouchableOpacity
          onPress={saving ? undefined : confirmDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="delete-outline" color={AppColors.danger} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.photoWrap} onPress={() => setSheetOpen(true)} activeOpacity={0.85}>
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
        <Text style={styles.photoHint}>Tap to change photo</Text>

        <View style={{ height: 12 }} />

        <SectionLabel text="Basic details" />
        <View style={styles.card}>
          <Field icon="person-outline" label="Customer name *" value={name} onChangeText={setName} />
          <Field icon="call" label="Mobile number *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field icon="phone-forwarded" label="Alternate number" value={altPhone} onChangeText={setAltPhone} keyboardType="phone-pad" />
          <Field icon="mail-outline" label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" isLast />
        </View>

        <SectionLabel text="Address" />
        <View style={styles.card}>
          <Field icon="location-on" label="Address" value={address} onChangeText={setAddress} multiline />
          <Field icon="location-city" label="City" value={city} onChangeText={setCity} isLast />
        </View>

        <SectionLabel text="Business (optional)" />
        <View style={styles.card}>
          <Field icon="receipt-long" label="GST number" value={gst} onChangeText={setGst} isLast />
        </View>

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={update} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <>
              <Icon name="check" color="#fff" size={18} />
              <Text style={styles.saveButtonText}>Update Customer</Text>
            </>
          )}
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
  icon, label, value, onChangeText, keyboardType, multiline, isLast,
}: {
  icon: any; label: string; value: string; onChangeText: (v: string) => void;
  keyboardType?: any; multiline?: boolean; isLast?: boolean;
}) {
  return (
    <View style={[styles.fieldBox, !isLast && styles.fieldBoxBorder]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.dangerSoft,
    borderWidth: 1,
    borderColor: `${AppColors.danger}20`,
  },

  content: { padding: 16, paddingBottom: 84 },

  photoWrap: { alignSelf: 'center', marginTop: 8 },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: AppColors.primarySoft,
    borderWidth: 1,
    borderColor: `${AppColors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: 80, height: 80, borderRadius: 24 },
  initialsText: { color: AppColors.primary, fontSize: 24, fontWeight: '700' },
  editBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: AppColors.surface,
  },
  photoHint: { textAlign: 'center', color: AppColors.textMuted, fontSize: 11.5, marginTop: 8 },

  sectionLabel: { color: AppColors.textSecondary, fontSize: 11.5, fontWeight: '700', marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.6 },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    overflow: 'hidden',
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldBoxBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  fieldInput: { flex: 1, marginLeft: 10, color: AppColors.textPrimary, fontSize: 13.5, padding: 0 },

  saveButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16, paddingBottom: 40 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', gap: 10 },
  photoOption: { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: AppColors.surfaceSoft, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border },
  photoOptionLabel: { color: AppColors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 6 },
  removeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
  removeText: { color: AppColors.danger, fontSize: 13, fontWeight: '500' },
});