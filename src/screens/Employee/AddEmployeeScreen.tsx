import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { EmployeeService, DepartmentRecord } from '../../services/EmployeeService';
import { AppColors } from '../theme/AppColors';

const service = new EmployeeService();

export default function AddEmployeeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onSaved: (() => void) | undefined = route.params?.onSaved;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [designation, setDesignation] = useState('');
  const [basic, setBasic] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');

  const [joiningDate, setJoiningDate] = useState(new Date());
  const [dob, setDob] = useState<Date | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<Asset | null>(null);
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);

  const [showJoiningPicker, setShowJoiningPicker] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setDepartments(await service.getDepartments());
      } catch { /* non-fatal */ }
      finally { setLoadingLookups(false); }
    })();
  }, []);

  const pickProfileImage = async () => {
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 1000, maxHeight: 1000 });
      if (!result.didCancel && result.assets?.length) setProfileImage(result.assets[0]);
    } catch (e: any) {
      Alert.alert('Failed to select image', String(e.message ?? e));
    }
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('Full name is required');
    if (!email.trim()) return Alert.alert('Email is required to send the invitation');

    setSaving(true);
    try {
      const created = await service.addEmployee({
        full_name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        date_of_birth: dob ? dob.toISOString().split('T')[0] : null,
        gender,
        profile_photo_file: profileImage ? { uri: profileImage.uri!, fileName: profileImage.fileName, type: profileImage.type } : null,
        department_id: departmentId,
        designation: designation.trim() || null,
        joining_date: joiningDate.toISOString().split('T')[0],
        employment_type: employmentType,
        basic_salary: parseFloat(basic) || 0,
        allowances: parseFloat(allowances) || 0,
        deductions: parseFloat(deductions) || 0,
        status: 'ACTIVE',
      });
      onSaved?.();
      navigation.goBack();
      return created;
    } catch (e: any) {
      Alert.alert('Failed to save', String(e.message ?? e));
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
  <TouchableOpacity 
    onPress={() => navigation.goBack()}
    style={{ marginTop: 29 }}
  >
    <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
  </TouchableOpacity>
  <Text style={[styles.headerTitle, { marginTop: 29 }]}>Add employee</Text>
  <View style={{ width: 22 }} />
</View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionLabel text="Personal information" />

        <TouchableOpacity style={styles.photoRow} onPress={pickProfileImage}>
          {profileImage?.uri ? (
            <Image source={{ uri: profileImage.uri }} style={styles.photoThumb} />
          ) : (
            <View style={styles.photoPlaceholder}><Icon name="person-outline" color={AppColors.textMuted} size={30} /></View>
          )}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.photoTitle}>{profileImage ? 'Profile photo selected' : 'Profile photo'}</Text>
            <Text style={styles.photoHint}>{profileImage ? 'Tap to change photo' : 'Tap to upload photo'}</Text>
          </View>
          <Icon name="camera-alt" color={AppColors.textMuted} size={20} />
        </TouchableOpacity>

        <Field icon="person-outline" label="Full name *" value={name} onChangeText={setName} />
        <Field icon="call" label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field icon="mail-outline" label="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" />

        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDobPicker(true)}>
          <Icon name="cake" color={AppColors.textMuted} size={20} />
          <Text style={styles.dateText}>{dob ? `Date of birth: ${dob.toLocaleDateString()}` : 'Date of birth'}</Text>
          <Icon name="calendar-today" color={AppColors.textMuted} size={18} />
        </TouchableOpacity>
        {showDobPicker && (
          <DateTimePicker
            value={dob ?? new Date(2000, 0, 1)}
            mode="date"
            maximumDate={new Date()}
            minimumDate={new Date(1950, 0, 1)}
            onChange={(_, date) => { setShowDobPicker(Platform.OS === 'ios'); if (date) setDob(date); }}
          />
        )}

        <Dropdown label="Gender" icon="person-outline" value={gender} onChange={setGender}
          items={[{ id: 'MALE', name: 'Male' }, { id: 'FEMALE', name: 'Female' }, { id: 'OTHER', name: 'Other' }]} />

        <Field icon="location-on" label="Address" value={address} onChangeText={setAddress} multiline />

        <SectionLabel text="Job information" />
        <Dropdown label="Department" icon="apartment" value={departmentId} onChange={setDepartmentId}
          items={departments.map((d) => ({ id: d.id, name: d.name }))} />
        <Field icon="work-outline" label="Designation" value={designation} onChangeText={setDesignation} />

        <TouchableOpacity style={styles.dateRow} onPress={() => setShowJoiningPicker(true)}>
          <Icon name="calendar-today" color={AppColors.textMuted} size={18} />
          <Text style={styles.dateText}>Joining date: {joiningDate.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showJoiningPicker && (
          <DateTimePicker
            value={joiningDate}
            mode="date"
            onChange={(_, date) => { setShowJoiningPicker(Platform.OS === 'ios'); if (date) setJoiningDate(date); }}
          />
        )}

        <Dropdown label="Employment type" icon="badge" value={employmentType} onChange={(v) => setEmploymentType(v ?? 'FULL_TIME')}
          items={[{ id: 'FULL_TIME', name: 'Full Time' }, { id: 'PART_TIME', name: 'Part Time' }, { id: 'CONTRACT', name: 'Contract' }]} />

        <SectionLabel text="Salary information" />
        <Field icon="currency-rupee" label="Basic salary" value={basic} onChangeText={setBasic} keyboardType="numeric" />
        <View style={styles.row}>
          <View style={{ flex: 1 }}><Field icon="add-circle-outline" label="Allowances" value={allowances} onChangeText={setAllowances} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field icon="remove-circle-outline" label="Deductions" value={deductions} onChangeText={setDeductions} keyboardType="numeric" /></View>
        </View>

        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save employee</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ text }: { text: string }) { return <Text style={styles.sectionLabel}>{text}</Text>; }

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

function Dropdown({ label, icon, value, items, onChange }: {
  label: string; icon: any; value: string | null; items: { id: string; name: string }[]; onChange: (v: string | null) => void;
}) {
  return (
    <View style={styles.fieldBox}>
      <Icon name={icon} color={AppColors.textMuted} size={20} />
      <View style={{ flex: 1 }}>
        <Picker selectedValue={value ?? ''} onValueChange={(v) => onChange(v === '' ? null : String(v))}>
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
  photoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 14, marginBottom: 12 },
  photoThumb: { width: 58, height: 58, borderRadius: 10 },
  photoPlaceholder: { width: 58, height: 58, borderRadius: 10, backgroundColor: AppColors.background, alignItems: 'center', justifyContent: 'center' },
  photoTitle: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '500' },
  photoHint: { color: AppColors.textMuted, fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', gap: 10 },
  fieldBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginBottom: 12 },
  fieldInput: { flex: 1, paddingVertical: 14, marginLeft: 10, color: AppColors.textPrimary, fontSize: 14 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 14, marginBottom: 12 },
  dateText: { flex: 1, color: AppColors.textPrimary, fontSize: 14 },
  saveButton: { backgroundColor: AppColors.primary, borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});