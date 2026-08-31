import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { ProductService } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const service = new ProductService();

export default function QrCodeScannerScreen() {
  const navigation = useNavigation<any>();
  const [manualCode, setManualCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const handledRef = useRef(false);

  // QR codes generated in this app encode the product's `id`.
  const lookup = async (code: string) => {
    if (!code.trim() || handledRef.current) return;
    handledRef.current = true;
    setSearching(true);

    try {
      const product = await service.findById(code.trim());
      setSearching(false);

      if (product) {
        navigation.navigate('ProductDetails', { product });
        // Allow scanning again once they navigate back.
        setTimeout(() => { handledRef.current = false; }, 500);
      } else {
        Alert.alert('No product found with that code');
        handledRef.current = false;
      }
    } catch (e: any) {
      setSearching(false);
      Alert.alert('Lookup failed', String(e.message ?? e));
      handledRef.current = false;
    }
  };

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
  <TouchableOpacity 
    onPress={() => navigation.goBack()}
    style={{ marginTop: 29 }}
  >
    <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
  </TouchableOpacity>
  <Text style={[styles.headerTitle, { marginTop: 35 }]}>Scan QR code</Text>
  <TouchableOpacity 
    onPress={() => setTorchOn((v) => !v)}
    style={{ marginTop: 29 }}
  >
    <Icon name={torchOn ? 'flash-on' : 'flash-off'} color={torchOn ? AppColors.primary : AppColors.textMuted} size={22} />
  </TouchableOpacity>
</View>
      <View style={styles.content}>
        <View style={styles.cameraWrap}>
          <Camera
            style={StyleSheet.absoluteFill}
            cameraType={CameraType.Back}
            scanBarcode
            onReadCode={(event: any) => lookup(event.nativeEvent.codeStringValue)}
            torchMode={torchOn ? 'on' : 'off'}
          />
          <View style={styles.frame} />
          {searching && <ActivityIndicator color={AppColors.primary} />}
          <Text style={styles.frameHint}>Point camera at the product QR code</Text>
        </View>

        <View style={styles.manualBox}>
          <TextInput
            style={styles.manualInput}
            placeholder="Enter code manually"
            placeholderTextColor={AppColors.textMuted}
            value={manualCode}
            onChangeText={setManualCode}
            onSubmitEditing={() => { handledRef.current = false; lookup(manualCode); }}
          />
          <TouchableOpacity onPress={() => { handledRef.current = false; lookup(manualCode); }}>
            <Icon name="search" color={AppColors.primary} size={22} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  content: { flex: 1, padding: 16 },
  cameraWrap: { flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 220, height: 220, borderWidth: 2, borderColor: AppColors.primary, borderRadius: 18 },
  frameHint: { position: 'absolute', bottom: 16, color: '#fff', fontSize: 12.5, fontWeight: '600' },
  manualBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginTop: 16 },
  manualInput: { flex: 1, paddingVertical: 14, color: AppColors.textPrimary, fontSize: 14 },
});