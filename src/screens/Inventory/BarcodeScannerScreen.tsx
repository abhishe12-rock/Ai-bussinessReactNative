import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { ProductService, ProductRecord } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const service = new ProductService();

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<any>();
  const [manualCode, setManualCode] = useState('');
  const [found, setFound] = useState<ProductRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [paused, setPaused] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const lookup = async (barcode: string) => {
    if (!barcode.trim() || searching) return;
    setSearching(true);
    setNotFound(false);
    setFound(null);
    setPaused(true);

    try {
      const product = await service.findByBarcode(barcode.trim());
      setFound(product);
      setNotFound(!product);
    } catch (e: any) {
      Alert.alert('Lookup failed', String(e.message ?? e));
    } finally {
      setSearching(false);
    }
  };

  const resumeScanning = () => {
    setFound(null);
    setNotFound(false);
    setPaused(false);
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
  <Text style={[styles.headerTitle, { marginTop: 29 }]}>Scan barcode</Text>
  <TouchableOpacity 
    onPress={() => setTorchOn((v) => !v)}
    style={{ marginTop: 29 }}
  >
    <Icon name={torchOn ? 'flash-on' : 'flash-off'} color={torchOn ? AppColors.primary : AppColors.textMuted} size={22} />
  </TouchableOpacity>
</View>

      <View style={styles.content}>
        <View style={styles.cameraWrap}>
          {!paused && (
            <Camera
              style={StyleSheet.absoluteFill}
              cameraType={CameraType.Back}
              scanBarcode
              onReadCode={(event: any) => lookup(event.nativeEvent.codeStringValue)}
              torchMode={torchOn ? 'on' : 'off'}
            />
          )}
          <View style={styles.frame} />
          {!paused && <Text style={styles.frameHint}>Align the barcode within the frame</Text>}
        </View>

        <View style={styles.manualBox}>
          <TextInput
            style={styles.manualInput}
            placeholder="Enter barcode manually"
            placeholderTextColor={AppColors.textMuted}
            value={manualCode}
            onChangeText={setManualCode}
            onSubmitEditing={() => lookup(manualCode)}
          />
          <TouchableOpacity onPress={() => lookup(manualCode)}>
            <Icon name="search" color={AppColors.primary} size={22} />
          </TouchableOpacity>
        </View>

        {searching && <ActivityIndicator color={AppColors.primary} style={{ marginTop: 16 }} />}

        {notFound && (
          <View style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={styles.notFoundText}>No product found with that barcode</Text>
            <TouchableOpacity onPress={resumeScanning}><Text style={styles.scanAgainLink}>Scan again</Text></TouchableOpacity>
          </View>
        )}

        {found && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.foundLabel}>Product found</Text>
            <View style={styles.foundCard}>
              <View style={styles.foundIcon}><Icon name="smartphone" color={AppColors.primary} size={22} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.foundName}>{found.name}</Text>
                <Text style={styles.foundBarcode}>{found.barcode ?? ''}</Text>
              </View>
              <Text style={styles.foundPrice}>₹{found.sellingPrice.toFixed(0)}</Text>
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.scanAgainButton} onPress={resumeScanning}>
                <Text style={styles.scanAgainButtonText}>Scan again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addToSaleButton} onPress={() => navigation.navigate({ name: 'NewSale', params: { scannedProduct: found }, merge: true })}>
                <Icon name="add-shopping-cart" color="#fff" size={18} />
                <Text style={styles.addToSaleText}>Add to sale</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  frame: { width: 240, height: 150, borderWidth: 2, borderColor: AppColors.primary, borderRadius: 14 },
  frameHint: { position: 'absolute', bottom: 16, color: '#fff', fontSize: 12.5, fontWeight: '600' },
  manualBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, marginTop: 16 },
  manualInput: { flex: 1, paddingVertical: 14, color: AppColors.textPrimary, fontSize: 14 },
  notFoundText: { color: AppColors.danger, fontSize: 12.5, fontWeight: '600' },
  scanAgainLink: { color: AppColors.primary, marginTop: 8 },
  foundLabel: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '600', marginBottom: 10 },
  foundCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13 },
  foundIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  foundName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  foundBarcode: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  foundPrice: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  scanAgainButton: { flex: 1, borderWidth: 1, borderColor: AppColors.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  scanAgainButtonText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' },
  addToSaleButton: { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: AppColors.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  addToSaleText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});