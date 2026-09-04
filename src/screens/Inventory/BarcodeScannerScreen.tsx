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
  Platform,
} from 'react-native';
import { Camera, CameraType } from 'react-native-camera-kit';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { ProductService, ProductRecord } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

const service = new ProductService();

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<any>();
  const [mode, setMode] = useState<'scan' | 'manual'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [found, setFound] = useState<ProductRecord | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);
  const [paused, setPaused] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const inputRef = useRef<any>(null);

  const lookup = async (barcode: string) => {
    if (!barcode.trim() || searching) return;
    Keyboard.dismiss();
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

  const switchToManual = () => {
    setMode('manual');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const switchToScan = () => {
    Keyboard.dismiss();
    setMode('scan');
    resumeScanning();
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
          <Text style={styles.headerTitle}>Scan Barcode</Text>
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
            {!paused && (
              <Camera
                style={StyleSheet.absoluteFill}
                cameraType={CameraType.Back}
                scanBarcode
                onReadCode={(event: any) => lookup(event.nativeEvent.codeStringValue)}
                torchMode={torchOn ? 'on' : 'off'}
              />
            )}
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {searching && (
              <View style={styles.searchingOverlay}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.searchingText}>Searching product...</Text>
              </View>
            )}

            {!paused && !searching && (
              <Text style={styles.frameHint}>Align barcode within the frame</Text>
            )}
          </View>

          {notFound && (
            <View style={styles.notFoundCard}>
              <Icon name="error-outline" color={AppColors.danger} size={24} />
              <View style={{ flex: 1 }}>
                <Text style={styles.notFoundText}>No product found with this barcode</Text>
                <Text style={styles.notFoundSub}>Check the code or scan again</Text>
              </View>
              <TouchableOpacity style={styles.retryScanBtn} onPress={resumeScanning}>
                <Text style={styles.retryScanBtnText}>Scan again</Text>
              </TouchableOpacity>
            </View>
          )}

          {found && (
            <View style={styles.foundOverlay}>
              <View style={styles.foundCard}>
                <View style={styles.foundIcon}>
                  <Icon name="smartphone" color={AppColors.primary} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foundName} numberOfLines={1}>{found.name}</Text>
                  <Text style={styles.foundBarcode}>Barcode: {found.barcode ?? 'N/A'}</Text>
                </View>
                <Text style={styles.foundPrice}>₹{found.sellingPrice.toFixed(0)}</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.scanAgainButton} onPress={resumeScanning}>
                  <Text style={styles.scanAgainButtonText}>Scan again</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addToSaleButton} 
                  onPress={() => navigation.navigate({ name: 'NewSale', params: { scannedProduct: found }, merge: true })}
                >
                  <Icon name="add-shopping-cart" color="#fff" size={18} />
                  <Text style={styles.addToSaleText}>Add to sale</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ) : (
        /* MANUAL ENTRY MODE - Camera is hidden, full space for keyboard and inputs */
        <ScrollView 
          style={styles.manualScroll}
          contentContainerStyle={styles.manualScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.manualCard}>
            <View style={styles.manualHeaderRow}>
              <View style={styles.manualIconWrap}>
                <Icon name="qr-code-scanner" color={AppColors.primary} size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.manualCardTitle}>Enter Barcode Number</Text>
                <Text style={styles.manualCardSubtitle}>
                  Type the barcode digits printed on the product
                </Text>
              </View>
            </View>

            <View style={styles.manualInputRow}>
              <Icon name="search" color={AppColors.textMuted} size={20} style={{ marginRight: 8 }} />
              <TextInput
                ref={inputRef}
                style={styles.manualInput}
                placeholder="e.g. 8901030382031"
                placeholderTextColor={AppColors.textMuted}
                value={manualCode}
                onChangeText={setManualCode}
                onSubmitEditing={() => lookup(manualCode)}
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
              onPress={() => lookup(manualCode)}
              disabled={!manualCode.trim() || searching}
              activeOpacity={0.8}
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="search" color="#fff" size={18} />
                  <Text style={styles.searchBtnText}>Search Product</Text>
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
                No product matches barcode "{manualCode.trim()}". Please verify the code or try scanning with the camera.
              </Text>
              <TouchableOpacity style={styles.tryScanBtn} onPress={switchToScan}>
                <Icon name="camera-alt" color={AppColors.primary} size={16} />
                <Text style={styles.tryScanBtnText}>Switch to Camera Scan</Text>
              </TouchableOpacity>
            </View>
          )}

          {found && (
            <View style={styles.foundManualWrap}>
              <Text style={styles.foundLabel}>Product Found</Text>
              <View style={styles.foundCard}>
                <View style={styles.foundIcon}>
                  <Icon name="smartphone" color={AppColors.primary} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foundName}>{found.name}</Text>
                  <Text style={styles.foundBarcode}>Barcode: {found.barcode ?? 'N/A'}</Text>
                  {found.imei ? <Text style={styles.foundSku}>IMEI: {found.imei}</Text> : null}
                </View>
                <Text style={styles.foundPrice}>₹{found.sellingPrice.toFixed(0)}</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity 
                  style={styles.scanAgainButton} 
                  onPress={() => {
                    setFound(null);
                    setManualCode('');
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                >
                  <Text style={styles.scanAgainButtonText}>Clear & Search Another</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.addToSaleButton} 
                  onPress={() => navigation.navigate({ name: 'NewSale', params: { scannedProduct: found }, merge: true })}
                >
                  <Icon name="add-shopping-cart" color="#fff" size={18} />
                  <Text style={styles.addToSaleText}>Add to sale</Text>
                </TouchableOpacity>
              </View>
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
    width: 250,
    height: 160,
    borderRadius: 12,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
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

  notFoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${AppColors.danger}12`,
    borderWidth: 1,
    borderColor: `${AppColors.danger}30`,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  notFoundText: { color: AppColors.danger, fontSize: 13, fontWeight: '700' },
  notFoundSub: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 2 },
  retryScanBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AppColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  retryScanBtnText: { color: AppColors.textPrimary, fontSize: 12, fontWeight: '600' },

  foundOverlay: { marginTop: 12 },
  foundLabel: {
    color: AppColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  foundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 12,
    shadowColor: AppColors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  foundIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  foundName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  foundBarcode: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  foundSku: { color: AppColors.textMuted, fontSize: 11, marginTop: 1 },
  foundPrice: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  scanAgainButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: AppColors.surface,
  },
  scanAgainButtonText: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  addToSaleButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToSaleText: { color: '#fff', fontSize: 13, fontWeight: '600' },

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
  foundManualWrap: { marginTop: 16 },
});