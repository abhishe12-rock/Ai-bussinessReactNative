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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

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
    <TouchableOpacity 
      onPress={() => navigation.goBack()}
      style={{ marginTop: 29 }}
    >
      <Icon name="arrow-back" color={AppColors.textPrimary} size={22} />
    </TouchableOpacity>
    <Text style={[styles.headerTitle, { marginTop: 29 }]}>Brands</Text>
    <View style={{ width: 22 }} />
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
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.cardName}>{item.name}</Text>
              <TouchableOpacity onPress={() => setMenuOpenId(menuOpenId === item.id ? null : item.id)}>
                <Icon name="more-vert" color={AppColors.textMuted} size={20} />
              </TouchableOpacity>
              {menuOpenId === item.id && (
                <View style={styles.menu}>
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpenId(null); openDialog(item); }}>
                    <Icon name="edit" color={AppColors.textSecondary} size={16} /><Text style={styles.menuText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpenId(null); confirmDelete(item); }}>
                    <Icon name="delete-outline" color={AppColors.danger} size={16} /><Text style={[styles.menuText, { color: AppColors.danger }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: AppColors.surface, borderBottomWidth: 1, borderColor: AppColors.border },
  headerTitle: { fontSize: 18, fontWeight: '700', color: AppColors.textPrimary },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 13 },
  avatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: AppColors.primary, fontSize: 16, fontWeight: '800' },
  cardName: { flex: 1, color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  menu: { position: 'absolute', right: 0, top: 40, backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, elevation: 4, zIndex: 10, width: 130 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  menuText: { color: AppColors.textPrimary, fontSize: 13 },
  fab: { position: 'absolute', right: 16, bottom: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primary, borderRadius: 28, paddingVertical: 14, paddingHorizontal: 18, gap: 8, elevation: 4 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surface, borderRadius: 16, padding: 20, width: '85%' },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 14 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, padding: 12, color: AppColors.textPrimary },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 16 },
  dialogCancel: { color: AppColors.textSecondary, fontSize: 14 },
  dialogSave: { color: AppColors.primary, fontWeight: '700', fontSize: 14 },
});