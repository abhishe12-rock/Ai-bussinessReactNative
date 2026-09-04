import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Modal, TextInput, RefreshControl, Alert } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { BrandService, BrandRecord } from '../../services/BrandService';
import { AppColors } from '../theme/AppColors';

const service = new BrandService();

export default function BrandsScreen() {
  const navigation = useNavigation<any>();
  const [brands, setBrands] = useState<BrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrandRecord | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeBrand, setActiveBrand] = useState<BrandRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBrands(await service.getBrands());
    } catch (e: any) {
      setError(`Failed to load brands: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDialog = (existing?: BrandRecord) => {
    setEditing(existing ?? null);
    setName(existing?.name ?? '');
    setDialogOpen(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await service.updateBrand({ id: editing.id, name: name.trim() });
      } else {
        await service.addBrand({ id: '', name: name.trim() });
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      Alert.alert('Failed', String(e.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (brand: BrandRecord) => {
    Alert.alert('Delete brand?', `"${brand.name}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await service.deleteBrand(brand.id); load(); }
        catch (e: any) { Alert.alert('Delete failed', String(e.message ?? e)); }
      } },
    ]);
  };

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
      <Text style={styles.headerTitle}>Brands</Text>
    </View>
  </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : brands.length === 0 ? (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconWrap}><Icon name="local-offer" color={AppColors.primary} size={28} /></View>
          <Text style={styles.emptyTitle}>No brands yet</Text>
          <Text style={styles.emptySubtitle}>Tap "Add brand" to create your first one</Text>
        </View>
      ) : (
        <FlatList
          data={brands}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.cardName}>{item.name}</Text>
              <TouchableOpacity
                onPress={() => setActiveBrand(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.moreBtn}
              >
                <Icon name="more-vert" color={AppColors.textMuted} size={20} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => openDialog()}>
        <Icon name="add" color="#fff" size={20} />
        <Text style={styles.fabText}>Add brand</Text>
      </TouchableOpacity>

      <Modal visible={dialogOpen} transparent animationType="fade" onRequestClose={() => setDialogOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{editing ? 'Edit brand' : 'Add brand'}</Text>
            <TextInput style={styles.dialogInput} placeholder="Brand name" placeholderTextColor={AppColors.textMuted} value={name} onChangeText={setName} />
            <View style={styles.dialogActions}>
              <TouchableOpacity onPress={() => setDialogOpen(false)}><Text style={styles.dialogCancel}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color={AppColors.primary} /> : <Text style={styles.dialogSave}>{editing ? 'Save' : 'Add'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BRAND ACTIONS SHEET */}
      <Modal
        visible={!!activeBrand}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveBrand(null)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setActiveBrand(null)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {activeBrand && (
              <>
                <View style={styles.sheetHeaderRow}>
                  <View style={styles.sheetAvatar}>
                    <Text style={styles.sheetAvatarText}>{activeBrand.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetBrandName} numberOfLines={1}>{activeBrand.name}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const b = activeBrand;
                    setActiveBrand(null);
                    openDialog(b);
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.primary}14` }]}>
                    <Icon name="edit" color={AppColors.primary} size={18} />
                  </View>
                  <Text style={styles.actionText}>Edit brand</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const b = activeBrand;
                    setActiveBrand(null);
                    confirmDelete(b);
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.danger}14` }]}>
                    <Icon name="delete-outline" color={AppColors.danger} size={18} />
                  </View>
                  <Text style={[styles.actionText, { color: AppColors.danger }]}>Delete brand</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveBrand(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: {
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 14,
    backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    marginLeft: -6,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: AppColors.border, padding: 14,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 3,
  },
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: `${AppColors.primary}35` },
  avatarText: { color: AppColors.primaryLight, fontSize: 16, fontWeight: '800' },
  cardName: { flex: 1, color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  moreBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute', right: 16, bottom: 84, flexDirection: 'row', alignItems: 'center',
    backgroundColor: AppColors.primary, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 20, gap: 7,
    shadowColor: AppColors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surfaceElevated, borderRadius: 20, padding: 22, width: '85%', borderWidth: 1, borderColor: AppColors.border },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 15.5, fontWeight: '700', marginBottom: 14 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 12, padding: 12, color: AppColors.textPrimary, backgroundColor: AppColors.surfaceInput },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
  dialogCancel: { color: AppColors.textSecondary, fontSize: 14 },
  dialogSave: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AppColors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 6,
  },
  sheetAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetAvatarText: { color: AppColors.primary, fontSize: 16, fontWeight: '800' },
  sheetBrandName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  actionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: AppColors.surfaceSoft,
    marginHorizontal: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
});