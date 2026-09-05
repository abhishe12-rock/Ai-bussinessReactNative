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
import {
  FadeInUp,
  FloatingGeometricOrb,
  SpringTouch,
  ScaleIn,
} from '../theme/Animations';

const service = new CustomerService();

export default function AddCustomerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [gst, setGst] = useState('');
  const [photo, setPhoto] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const pickImage = async (source: 'camera' | 'gallery') => {
    const result = source === 'camera'
      ? await launchCamera({ mediaType: 'photo', quality: 0.8, maxWidth: 800 })
      : await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 800 });

    if (result.didCancel || !result.assets?.length) return;
    setPhoto(result.assets[0]);
  };

  const save = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Name and mobile number are required');
      return;
    }

    setSaving(true);
    try {
      let photoUrl: string | undefined;
      if (photo?.uri) {
        const file: LocalImageFile = { uri: photo.uri, fileName: photo.fileName, type: photo.type };
        photoUrl = await service.uploadCustomerPhoto(file);
      }

      const customer: CustomerRecord = {
        id: '',
        name: name.trim(),
        phone: phone.trim(),
        alternatePhone: altPhone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        gstNumber: gst.trim() || null,
        photoUrl: photoUrl ?? null,
      };

      const created = await service.addCustomer(customer);
      onSaved?.();
      navigation.goBack();
      return created;
    } catch (e: any) {
      Alert.alert('Failed to save', String(e.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.flex}>
      {/* Background ambient orbs */}
      <FloatingGeometricOrb
        size={220}
        top={-50}
        right={-60}
        color="rgba(91, 77, 248, 0.07)"
        duration={5500}
        floatDistance={12}
      />
      <FloatingGeometricOrb
        size={150}
        bottom={40}
        left={-40}
        color="rgba(16, 185, 129, 0.06)"
        duration={4500}
        floatDistance={10}
      />

      <View style={styles.header}>
        <SpringTouch
          onPress={() => navigation.goBack()}
          activeScale={0.88}
          style={{ padding: 4 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </SpringTouch>
        <Text style={styles.headerTitle}>Add Customer</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScaleIn delay={80} initialScale={0.7} bounciness={10}>
          <TouchableOpacity style={styles.photoWrap} onPress={() => setSheetOpen(true)} activeOpacity={0.8}>
            <View style={styles.photoCircle}>
              {photo?.uri ? (
                <Image source={{ uri: photo.uri }} style={styles.photoImg} />
              ) : (
                <Icon name="add-a-photo" color={AppColors.primary} size={26} />
              )}
            </View>
            <View style={styles.editBadge}>
              <Icon name="edit" color="#fff" size={13} />
            </View>
          </TouchableOpacity>
        </ScaleIn>
        <Text style={styles.photoLabel}>{photo ? 'Photo selected' : 'Upload photo (optional)'}</Text>

        <FadeInUp delay={120} distance={14}>
          <SectionLabel text="Basic details" />
          <Field icon="person-outline" label="Customer name *" value={name} onChangeText={setName} />
          <Field icon="call" label="Mobile number *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field icon="phone-forwarded" label="Alternate number" value={altPhone} onChangeText={setAltPhone} keyboardType="phone-pad" />
          <Field icon="mail-outline" label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
        </FadeInUp>

        <FadeInUp delay={200} distance={14}>
          <SectionLabel text="Location" />
          <Field icon="location-on" label="Street address" value={address} onChangeText={setAddress} multiline />
          <Field icon="location-city" label="City" value={city} onChangeText={setCity} />
        </FadeInUp>

        <FadeInUp delay={280} distance={14}>
          <SectionLabel text="Business (optional)" />
          <Field icon="receipt-long" label="GST number" value={gst} onChangeText={setGst} />
        </FadeInUp>

        <FadeInUp delay={340} distance={12}>
          <SpringTouch
            onPress={save}
            disabled={saving}
            activeScale={0.97}
            style={{ width: '100%', marginTop: 8 }}
          >
            <View style={[styles.saveButton, saving && { opacity: 0.6 }]}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Customer</Text>}
            </View>
          </SpringTouch>
        </FadeInUp>
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
            {photo && (
              <TouchableOpacity style={styles.removeRow} onPress={() => { setPhoto(null); setSheetOpen(false); }}>
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
    <TouchableOpacity style={styles.photoOption} onPress={onPress} activeOpacity={0.7}>
      <Icon name={icon} color={AppColors.primary} size={22} />
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
      <Icon name={icon} color={AppColors.textMuted} size={18} />
      <TextInput
        style={[styles.fieldInput, multiline && { height: 56, textAlignVertical: 'top' }]}
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  content: { padding: 16, paddingBottom: 84 },
  photoWrap: { alignSelf: 'center', marginTop: 4 },
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: AppColors.primarySoft,
    borderWidth: 1,
    borderColor: `${AppColors.primary}35`,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImg: { width: 80, height: 80, borderRadius: 24 },
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
  photoLabel: { textAlign: 'center', color: AppColors.textSecondary, fontSize: 12, marginTop: 8, marginBottom: 18, fontWeight: '500' },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 11.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginTop: 12 },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceInput,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 50,
  },
  fieldInput: { flex: 1, paddingVertical: 12, marginLeft: 8, color: AppColors.textPrimary, fontSize: 13.5 },
  saveButton: {
    backgroundColor: AppColors.primary,
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  saveButtonText: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: AppColors.surfaceElevated, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 40, borderTopWidth: 1, borderColor: AppColors.border },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 14 },
  sheetTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  sheetRow: { flexDirection: 'row', gap: 10 },
  photoOption: { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: AppColors.surfaceSoft, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border },
  photoOptionLabel: { color: AppColors.textPrimary, fontSize: 12, fontWeight: '600', marginTop: 6 },
  removeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
  removeText: { color: AppColors.danger, fontSize: 13, fontWeight: '500' },
});