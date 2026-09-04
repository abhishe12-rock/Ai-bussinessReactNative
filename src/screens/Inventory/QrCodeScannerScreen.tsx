import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { ProductService, ProductRecord } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const service = new ProductService();

export default function QrCodeScannerScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const handledRef = useRef(false);
  const inputRef = useRef<any>(null);

  // QR codes generated in this app encode the product's `id`.
  const lookup = async (code: string) => {
    if (!code.trim() || handledRef.current) return;
    Keyboard.dismiss();
    handledRef.current = true;
    setSearching(true);
    setNotFound(false);

    try {
      const product = await service.findById(code.trim());
      setSearching(false);

      if (product) {
        setNotFound(false);
        navigation.navigate('ProductDetails', { product });
        // Allow scanning again once they navigate back.
        setTimeout(() => { handledRef.current = false; }, 500);
      } else {
        setNotFound(true);
        Alert.alert('No product found', `No product found with code "${code.trim()}".`);
        handledRef.current = false;
      }
    } catch (e: any) {
      setSearching(false);
      Alert.alert('Lookup failed', String(e.message ?? e));
      handledRef.current = false;
    }
  };

  const switchToManual = () => {
    setMode('manual');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const switchToScan = () => {
    Keyboard.dismiss();
    setMode('scan');
    handledRef.current = false;
    setNotFound(false);
  };

  return (
    <View style={styles.flex}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color={AppColors.primary} size={30} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
        </View>

        {mode === 'scan' && (
          <TouchableOpacity 
            onPress={() => setTorchOn((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.torchBtn}
          >
            <Icon 
              name={torchOn ? 'flash-on' : 'flash-off'} 
              color={torchOn ? AppColors.primary : AppColors.textMuted} 
              size={22} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* MODE SEGMENTED CONTROL */}
      <View style={styles.segmentWrap}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, mode === 'scan' && styles.segmentBtnActive]}
            onPress={switchToScan}
            activeOpacity={0.8}
          >
            <Icon 
              name="camera-alt" 
              color={mode === 'scan' ? AppColors.primary : AppColors.textSecondary} 
              size={18} 
            />
            <Text style={[styles.segmentText, mode === 'scan' && styles.segmentTextActive]}>
              Camera Scanner
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, mode === 'manual' && styles.segmentBtnActive]}
            onPress={switchToManual}
            activeOpacity={0.8}
          >
            <Icon 
              name="keyboard" 
              color={mode === 'manual' ? AppColors.primary : AppColors.textSecondary} 
              size={18} 
            />
            <Text style={[styles.segmentText, mode === 'manual' && styles.segmentTextActive]}>
              Enter Manually
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CAMERA SCAN MODE */}
      {mode === 'scan' ? (
        <View style={styles.content}>
          <View style={styles.cameraWrap}>
            <Camera
              style={StyleSheet.absoluteFill}
              cameraType={CameraType.Back}
              scanBarcode
              onReadCode={(event: any) => lookup(event.nativeEvent.codeStringValue)}
              torchMode={torchOn ? 'on' : 'off'}
            />
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {searching && (
              <View style={styles.searchingOverlay}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.searchingText}>Looking up product...</Text>
              </View>
            )}

            {!searching && (
              <Text style={styles.frameHint}>Point camera at the product QR code</Text>
            )}
          </View>
        </View>
      ) : (
        /* MANUAL ENTRY MODE - Camera is hidden, plenty of space for keyboard */
        <ScrollView 
          style={styles.manualScroll}
          contentContainerStyle={styles.manualScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.manualCard}>
            <View style={styles.manualHeaderRow}>
              <View style={styles.manualIconWrap}>
                <Icon name="qr-code" color={AppColors.primary} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.manualCardTitle}>Enter Product Code / ID</Text>
                <Text style={styles.manualCardSubtitle}>
                  Type the product ID encoded inside the QR code
                </Text>
              </View>
            </View>

            <View style={styles.manualInputRow}>
              <Icon name="search" color={AppColors.textMuted} size={20} style={{ marginRight: 8 }} />
              <TextInput
                ref={inputRef}
                style={styles.manualInput}
                placeholder="e.g. prod_01h8..."
                placeholderTextColor={AppColors.textMuted}
                value={manualCode}
                onChangeText={(text) => {
                  setManualCode(text);
                  if (notFound) setNotFound(false);
                }}
                onSubmitEditing={() => { handledRef.current = false; lookup(manualCode); }}
                returnKeyType="search"
                keyboardType="default"
                autoCapitalize="none"
              />
              {manualCode.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setManualCode('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" color={AppColors.textMuted} size={18} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.searchBtn, (!manualCode.trim() || searching) && { opacity: 0.6 }]}
              onPress={() => { handledRef.current = false; lookup(manualCode); }}
              disabled={!manualCode.trim() || searching}
              activeOpacity={0.8}
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="search" color="#fff" size={18} />
                  <Text style={styles.searchBtnText}>Find Product Details</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {notFound && (
            <View style={styles.notFoundManualCard}>
              <View style={styles.notFoundIconWrap}>
                <Icon name="error-outline" color={AppColors.danger} size={28} />
              </View>
              <Text style={styles.notFoundManualTitle}>Product Not Found</Text>
              <Text style={styles.notFoundManualSub}>
                No product matches code "{manualCode.trim()}". Please verify the code or try scanning with the camera.
              </Text>
              <TouchableOpacity style={styles.tryScanBtn} onPress={switchToScan}>
                <Icon name="camera-alt" color={AppColors.primary} size={16} />
                <Text style={styles.tryScanBtnText}>Switch to Camera Scan</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { marginLeft: -6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  torchBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: AppColors.surfaceSoft,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* SEGMENTED CONTROL */
  segmentWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.surface,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  segmentTextActive: {
    color: AppColors.primary,
    fontWeight: '700',
  },

  /* CAMERA SCAN STYLES */
  content: { flex: 1, padding: 16 },
  cameraWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  frame: {
    width: 220,
    height: 220,
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: AppColors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  frameHint: {
    position: 'absolute',
    bottom: 20,
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: 0.3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  searchingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  searchingText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  bottomManualShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  bottomManualText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: AppColors.primary,
  },

  /* MANUAL SCREEN STYLES */
  manualScroll: { flex: 1 },
  manualScrollContent: { padding: 16, paddingBottom: 100 },
  manualCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  manualHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  manualIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  manualCardSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
  },
  manualInput: {
    flex: 1,
    paddingVertical: 13,
    color: AppColors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: 14,
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  notFoundManualCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  notFoundIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${AppColors.danger}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  notFoundManualTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  notFoundManualSub: {
    fontSize: 12.5,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  tryScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.primarySoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16,
  },
  tryScanBtnText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});