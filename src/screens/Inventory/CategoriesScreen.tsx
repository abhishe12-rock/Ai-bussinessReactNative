import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Modal, TextInput, RefreshControl, Alert, Pressable } from 'react-native';
import Icon from '@react-native-vector-icons/material-icons';
import { useNavigation } from '@react-navigation/native';

import { CategoryService, CategoryRecord } from '../../services/CategoryService';
import { AppColors } from '../theme/AppColors';

const service = new CategoryService();

export default function CategoriesScreen() {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRecord | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  // Active category whose action sheet (Edit/Delete) is open — replaces the old clipped inline menu
  const [activeCategory, setActiveCategory] = useState<CategoryRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await service.getCategories());
    } catch (e: any) {
      setError(`Failed to load categories: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(
    () => categories.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [categories, query],
  );

  const openDialog = (existing?: CategoryRecord) => {
    setEditing(existing ?? null);
    setName(existing?.name ?? '');
    setDesc(existing?.description ?? '');
    setDialogOpen(true);
  };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const record = { id: editing?.id ?? '', name: name.trim(), description: desc.trim() || null };
      if (editing) await service.updateCategory(record);
      else await service.addCategory(record);
      setDialogOpen(false);
      load();
    } catch (e: any) {
      Alert.alert('Failed', String(e.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (category: CategoryRecord) => {
    Alert.alert('Delete category?', `"${category.name}" will be removed. Products using this category will keep their existing category_id.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await service.deleteCategory(category.id); load(); }
        catch (e: any) { Alert.alert('Delete failed', String(e.message ?? e)); }
      } },
    ]);
  };

  return (
    <View style={styles.flex}>
      {/* HEADER — Cupertino-style back button, inline with title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron-left" color={AppColors.primary} size={30} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Icon name="search" color={AppColors.textMuted} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search category"
            placeholderTextColor={AppColors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" color={AppColors.textMuted} size={18} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.countText}>{loading ? 'Loading...' : `${filtered.length} categories`}</Text>
      </View>

      {loading ? (
        <View style={styles.centerFill}><ActivityIndicator color={AppColors.primary} /></View>
      ) : error ? (
        <View style={styles.centerFill}>
          <Icon name="error-outline" color={AppColors.danger} size={32} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centerFill}>
          <View style={styles.emptyIconWrap}><Icon name="category" color={AppColors.primary} size={28} /></View>
          <Text style={styles.emptyTitle}>No categories yet</Text>
          <Text style={styles.emptySubtitle}>Tap "Add category" to create your first one</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 150 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}><Icon name="category" color={AppColors.primary} size={20} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.description ? <Text style={styles.cardDesc} numberOfLines={1}>{item.description}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => setActiveCategory(item)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.moreBtn}
              >
                <Icon name="more-vert" color={AppColors.textMuted} size={20} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => openDialog()} activeOpacity={0.85}>
        <Icon name="add" color="#fff" size={20} />
        <Text style={styles.fabText}>Add category</Text>
      </TouchableOpacity>

      {/* ADD / EDIT DIALOG */}
      <Modal visible={dialogOpen} transparent animationType="fade" onRequestClose={() => setDialogOpen(false)}>
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <View style={styles.dialogIconWrap}>
              <Icon name="category" color={AppColors.primary} size={22} />
            </View>
            <Text style={styles.dialogTitle}>{editing ? 'Edit category' : 'Add category'}</Text>
            <TextInput
              style={styles.dialogInput}
              placeholder="Category name *"
              placeholderTextColor={AppColors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.dialogInput, { marginTop: 10, height: 70, textAlignVertical: 'top' }]}
              placeholder="Description (optional)"
              placeholderTextColor={AppColors.textMuted}
              value={desc}
              onChangeText={setDesc}
              multiline
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogCancelBtn} onPress={() => setDialogOpen(false)}>
                <Text style={styles.dialogCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogSaveBtn, !name.trim() && { opacity: 0.5 }]} onPress={save} disabled={saving || !name.trim()}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.dialogSave}>{editing ? 'Save' : 'Add'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CATEGORY ACTIONS SHEET — replaces the old clipped inline dropdown */}
      <Modal
        visible={!!activeCategory}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveCategory(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setActiveCategory(null)}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {activeCategory && (
              <>
                <View style={styles.sheetHeaderRow}>
                  <View style={styles.sheetAvatar}>
                    <Icon name="category" color={AppColors.primary} size={20} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetCategoryName} numberOfLines={1}>{activeCategory.name}</Text>
                    {activeCategory.description ? (
                      <Text style={styles.sheetCategorySub} numberOfLines={1}>{activeCategory.description}</Text>
                    ) : null}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const c = activeCategory;
                    setActiveCategory(null);
                    openDialog(c);
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.primary}14` }]}>
                    <Icon name="edit" color={AppColors.primary} size={18} />
                  </View>
                  <Text style={styles.actionText}>Edit category</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => {
                    const c = activeCategory;
                    setActiveCategory(null);
                    confirmDelete(c);
                  }}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: `${AppColors.danger}14` }]}>
                    <Icon name="delete-outline" color={AppColors.danger} size={18} />
                  </View>
                  <Text style={[styles.actionText, { color: AppColors.danger }]}>Delete category</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveCategory(null)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -6,
    minWidth: 80,
  },
  backLabel: {
    color: AppColors.primary,
    fontSize: 16,
    marginLeft: -4,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary, letterSpacing: -0.3 },
  headerSpacer: { minWidth: 80 }, // balances back button width so title stays visually centered

  searchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 10, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 11, marginLeft: 8, color: AppColors.textPrimary, fontSize: 13.5 },
  countText: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 6 },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: AppColors.textSecondary, fontSize: 12.5, textAlign: 'center', marginTop: 10 },
  retryText: { color: AppColors.primary, marginTop: 10, fontWeight: '600' },
  emptyIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { color: AppColors.textPrimary, fontSize: 14.5, fontWeight: '600' },
  emptySubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 4, textAlign: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface,
    borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12,
    shadowColor: AppColors.textPrimary, shadowOpacity: 0.02, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  avatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardName: { color: AppColors.textPrimary, fontSize: 13.5, fontWeight: '700' },
  cardDesc: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },
  moreBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },

  fab: {
    position: 'absolute', right: 16, bottom: 84, flexDirection: 'row', alignItems: 'center',
    backgroundColor: AppColors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 18, gap: 6,
    shadowColor: AppColors.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 13.5 },

  dialogBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center' },
  dialog: { backgroundColor: AppColors.surface, borderRadius: 14, padding: 20, width: '86%', borderWidth: 1, borderColor: AppColors.border },
  dialogIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dialogTitle: { color: AppColors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 16 },
  dialogInput: { borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, padding: 12, color: AppColors.textPrimary, fontSize: 14 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18 },
  dialogCancelBtn: { paddingVertical: 10, paddingHorizontal: 14 },
  dialogCancel: { color: AppColors.textSecondary, fontSize: 14, fontWeight: '600' },
  dialogSaveBtn: { backgroundColor: AppColors.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, minWidth: 64, alignItems: 'center' },
  dialogSave: { color: '#fff', fontWeight: '700', fontSize: 13.5 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: AppColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 4, backgroundColor: AppColors.border, alignSelf: 'center', marginBottom: 12 },
  sheetHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 16, marginBottom: 6,
    borderBottomWidth: 1, borderColor: AppColors.border,
  },
  sheetAvatar: { width: 40, height: 40, borderRadius: 10, backgroundColor: AppColors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sheetCategoryName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '700' },
  sheetCategorySub: { color: AppColors.textSecondary, fontSize: 12, marginTop: 2 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  actionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '600' },

  cancelBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: AppColors.textSecondary, fontSize: 14, fontWeight: '600' },
});