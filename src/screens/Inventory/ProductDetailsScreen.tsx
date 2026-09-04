import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ProductRecord } from '../../services/ProductService';
import { AppColors } from '../theme/AppColors';

export default function ProductDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const product: ProductRecord = route.params.product;
  const [imageIndex, setImageIndex] = useState(0);
  const [qrOpen, setQrOpen] = useState(false);
  const low = product.quantity < product.minimumStock;

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
          <Text style={styles.headerTitle}>Product Details</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={{ marginRight: 16 }} onPress={() => setQrOpen(true)}>
            <Icon name="qr-code-2" color={AppColors.primary} size={22} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('EditProduct', { product })}>
            <Icon name="edit" color={AppColors.primary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {product.imageUrls.length === 0 ? (
          <View style={styles.placeholderImage}><Icon name="smartphone" color={AppColors.primary} size={64} /></View>
        ) : (
          <>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width))}
              style={styles.imageCarousel}
            >
              {product.imageUrls.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.carouselImage} />
              ))}
            </ScrollView>
            {product.imageUrls.length > 1 && (
              <View style={styles.dotsRow}>
                {product.imageUrls.map((_, i) => (
                  <View key={i} style={[styles.dot, i === imageIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </>
        )}

        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productSub}>{product.brandName ?? '—'} · {product.categoryName ?? '—'}</Text>

        <View style={styles.statsRow}>
          <StatBox label="Selling price" value={`₹${product.sellingPrice.toFixed(0)}`} color={AppColors.primary} bg={AppColors.primarySoft} />
          <StatBox label="Stock" value={`${product.quantity} units`} color={low ? AppColors.danger : AppColors.success} bg={low ? AppColors.dangerSoft : AppColors.successSoft} />
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="currency-rupee" label="Purchase price" value={`₹${product.purchasePrice.toFixed(0)}`} />
          <InfoRow icon="qr-code-2" label="Barcode" value={product.barcode ?? 'Not set'} />
          <InfoRow icon="local-shipping" label="Supplier" value={product.supplierName ?? 'Not set'} />
          <InfoRow icon="warning-amber" label="Minimum stock" value={`${product.minimumStock} units`} />
          <InfoRow icon="verified" label="Warranty" value={product.warrantyMonths != null ? `${product.warrantyMonths} months` : 'Not set'} isLast />
        </View>

        {product.description ? (
          <>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </>
        ) : null}

        <TouchableOpacity style={styles.qrButton} onPress={() => setQrOpen(true)}>
          <Icon name="qr-code-2" color={AppColors.primary} size={20} />
          <Text style={styles.qrButtonText}>Generate QR code</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
        <View style={styles.qrBackdrop}>
          <View style={styles.qrDialog}>
            <Text style={styles.qrTitle}>{product.name}</Text>
            <View style={styles.qrCodeWrap}>
              <QRCode value={product.id} size={200} />
            </View>
            <Text style={styles.qrHint}>Print this and attach it to the product</Text>
            <TouchableOpacity style={styles.qrDoneButton} onPress={() => setQrOpen(false)}>
              <Text style={styles.qrDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, isLast }: { icon: any; label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Icon name={icon} color={AppColors.textMuted} size={18} />
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { marginLeft: -6 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 24 },
  placeholderImage: { height: 180, borderRadius: 12, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  imageCarousel: { height: 220, borderRadius: 12 },
  carouselImage: { width: 340, height: 220, borderRadius: 12 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AppColors.border },
  dotActive: { backgroundColor: AppColors.primary },
  productName: { color: AppColors.textPrimary, fontSize: 19, fontWeight: '800', marginTop: 18, letterSpacing: -0.3 },
  productSub: { color: AppColors.textSecondary, fontSize: 13, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox: {
    flex: 1, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: AppColors.border,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  statLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, opacity: 0.85 },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 5 },
  infoCard: {
    backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, marginTop: 20,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderColor: AppColors.border },
  infoLabel: { color: AppColors.textSecondary, fontSize: 13 },
  infoValue: { color: AppColors.textPrimary, fontSize: 13, fontWeight: '600' },
  sectionLabel: { color: AppColors.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 24, marginBottom: 8 },
  descriptionText: { color: AppColors.textPrimary, fontSize: 13.5, lineHeight: 20 },
  qrButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, marginTop: 20,
    backgroundColor: AppColors.surface,
    shadowColor: AppColors.textPrimary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  qrButtonText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' },
  qrBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', alignItems: 'center', justifyContent: 'center' },
  qrDialog: { backgroundColor: AppColors.surface, borderRadius: 14, padding: 24, alignItems: 'center', width: '85%', borderWidth: 1, borderColor: AppColors.border },
  qrTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  qrCodeWrap: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: AppColors.border },
  qrHint: { color: AppColors.textSecondary, fontSize: 11.5, marginTop: 12 },
  qrDoneButton: { backgroundColor: AppColors.primary, borderRadius: 10, paddingVertical: 12, width: '100%', alignItems: 'center', marginTop: 18 },
  qrDoneText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});