import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, FlatList, Platform, ActivityIndicator, Modal, Alert, ScrollView 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { AppColors } from '../theme/AppColors';
import { AiService } from '../../services/AiService';

interface DocItem {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'xlsx';
  size: string;
  date: string;
  status: 'processing' | 'processed';
  summary?: string;
}

const popularTemplates = [
  'Store Return Policy.pdf',
  'iPhone Screen Repair Guide.pdf',
  'Wholesale Price List 2026.xlsx',
  'Employee Leave Policy.pdf',
  'Warranty & Terms.pdf',
];

export default function DocumentCenterScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<DocItem[]>([]);
  const [uploadName, setUploadName] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);

  useEffect(() => {
    syncDocs();
  }, []);

  const syncDocs = () => {
    const aiDocs = AiService.getDocuments();
    const mapped = aiDocs.map((name, i) => {
      let type: any = 'pdf';
      let size = '2.4 MB';
      if (name.endsWith('.docx')) { type = 'docx'; size = '1.8 MB'; }
      else if (name.endsWith('.xlsx')) { type = 'xlsx'; size = '1.2 MB'; }

      return {
        id: i.toString(),
        name,
        type,
        size,
        date: 'Indexed & Ready',
        status: 'processed' as const,
        summary: `Full text & embeddings extracted for "${name}". The AI Assistant and AI Agents will use this document to answer questions accurately.`
      };
    });
    setDocs(mapped.reverse());
  };

  const handleUploadNamed = (fileName: string) => {
    const trimmed = fileName.trim();
    if (!trimmed) return;
    
    const newDocName = trimmed.includes('.') ? trimmed : trimmed + '.pdf';
    
    let type: any = 'pdf';
    if (newDocName.endsWith('.docx')) type = 'docx';
    else if (newDocName.endsWith('.xlsx')) type = 'xlsx';

    const newDoc: DocItem = {
      id: Date.now().toString(),
      name: newDocName,
      type,
      size: '2.5 MB',
      date: 'Just now',
      status: 'processing',
      summary: 'Extracting text, chunking and generating embeddings for AI...'
    };

    setDocs(prev => [newDoc, ...prev]);
    setUploadName('');

    setTimeout(() => {
      AiService.addDocument(newDocName);
      setDocs(prev => prev.map(d => d.id === newDoc.id ? { 
        ...d, 
        status: 'processed', 
        date: 'Indexed & Ready',
        summary: `Full text & embeddings extracted for "${newDocName}". The AI Assistant and AI Agents will use this document to answer questions accurately.`
      } : d));
    }, 1800);
  };

  const handlePickFile = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 1,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const fileName = file.fileName || `Scanned_Doc_${Date.now()}.pdf`;
        handleUploadNamed(fileName);
      }
    } catch (e) {
      console.log('File picker error:', e);
      Alert.alert('Upload Error', 'Could not open media picker.');
    }
  };

  const handleAskAiAboutDoc = (doc: DocItem) => {
    setSelectedDoc(null);
    if (navigation.navigate) {
      try {
        navigation.navigate('AiAssistant');
      } catch (e) {
        console.log("Nav error:", e);
      }
    }
  };

  const handleDeleteDoc = (doc: DocItem) => {
    Alert.alert(
      "Delete Document",
      `Are you sure you want to remove "${doc.name}" from your AI Knowledge Base?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            setDocs(prev => prev.filter(d => d.id !== doc.id));
            setSelectedDoc(null);
          }
        }
      ]
    );
  };

  const filteredDocs = docs.filter(d => 
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* RAG Banner */}
      <View style={styles.ragBanner}>
        <View style={styles.ragIconBox}>
          <MaterialCommunityIcons name="book-open-page-variant" color={AppColors.primary} size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.ragTitle}>RAG Knowledge Base</Text>
          <Text style={styles.ragSubtitle}>
            Uploaded policies, repair manuals, and catalogues are indexed so your AI Assistant & Agents can answer questions from them.
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" color="#9CA3AF" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents & manuals..."
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {/* Upload Section */}
      <Text style={styles.sectionTitle}>Upload Document</Text>
      
      {/* Action Buttons: Pick File & Text Input */}
      <View style={styles.uploadRow}>
        <TextInput 
          style={styles.uploadInput}
          placeholder="Type document name (e.g. Return Policy.pdf)"
          placeholderTextColor="#9CA3AF"
          value={uploadName}
          onChangeText={setUploadName}
          onSubmitEditing={() => handleUploadNamed(uploadName)}
        />
        <TouchableOpacity style={styles.uploadBtn} onPress={() => handleUploadNamed(uploadName)}>
          <MaterialCommunityIcons name="upload" color="#FFF" size={18} style={{ marginRight: 4 }} />
          <Text style={styles.uploadBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Pick From Storage Button */}
      <TouchableOpacity style={styles.browseStorageBtn} onPress={handlePickFile}>
        <MaterialCommunityIcons name="folder-upload-outline" size={20} color={AppColors.primary} />
        <Text style={styles.browseStorageBtnText}>Browse & Pick File From Device</Text>
      </TouchableOpacity>

      {/* Quick Add Presets */}
      <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 8 }]}>Quick-Add Business Templates</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templatePresetsRow}>
        {popularTemplates.map((tmpl) => (
          <TouchableOpacity 
            key={tmpl} 
            style={styles.templatePresetChip} 
            onPress={() => handleUploadNamed(tmpl)}
          >
            <MaterialCommunityIcons name="plus" size={16} color={AppColors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.templatePresetText}>{tmpl}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Files Header */}
      <View style={styles.docsHeaderRow}>
        <Text style={styles.sectionTitle}>Indexed Knowledge Files</Text>
        <Text style={styles.docsCount}>{filteredDocs.length} files active</Text>
      </View>
    </View>
  );

  const renderDocRow = ({ item }: { item: DocItem }) => (
    <DocRow doc={item} onPress={() => setSelectedDoc(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <MaterialCommunityIcons name="menu" size={24} color={AppColors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerTitle}>Document Center</Text>
          <Text style={styles.headerSubtitle}>Knowledge Base & AI Documents</Text>
        </View>
      </View>

      <FlatList
        data={filteredDocs}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderDocRow}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No documents found</Text>
          </View>
        }
      />

      {/* Document Action Modal */}
      {selectedDoc && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedDoc(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalIconBox}>
                  <MaterialCommunityIcons name="file-document-outline" color={AppColors.primary} size={24} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.modalDocName} numberOfLines={1}>{selectedDoc.name}</Text>
                  <Text style={styles.modalDocMeta}>{selectedDoc.size} • {selectedDoc.status === 'processed' ? 'Indexed ✓' : 'Processing...'}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedDoc(null)}>
                  <MaterialCommunityIcons name="close" size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSummaryText}>{selectedDoc.summary}</Text>

              <View style={styles.modalActionsList}>
                <TouchableOpacity 
                  style={styles.modalActionItem} 
                  onPress={() => handleAskAiAboutDoc(selectedDoc)}
                >
                  <MaterialCommunityIcons name="robot-outline" color={AppColors.primary} size={22} />
                  <Text style={styles.modalActionItemText}>Ask AI Assistant About This Doc</Text>
                  <MaterialCommunityIcons name="chevron-right" color="#9CA3AF" size={20} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalActionItem, { borderBottomWidth: 0 }]} 
                  onPress={() => handleDeleteDoc(selectedDoc)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" color="#EF4444" size={22} />
                  <Text style={[styles.modalActionItemText, { color: '#EF4444' }]}>Remove From Knowledge Base</Text>
                  <MaterialCommunityIcons name="chevron-right" color="#9CA3AF" size={20} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedDoc(null)}>
                <Text style={styles.modalCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const DocRow = ({ doc, onPress }: { doc: DocItem; onPress: () => void }) => {
  let icon = 'file-document-outline';
  let color = AppColors.textSecondary;
  let bg = '#F3F4F6';

  if (doc.type === 'pdf') {
    icon = 'file-pdf-box'; color = '#EF4444'; bg = '#FEF2F2';
  } else if (doc.type === 'docx') {
    icon = 'file-document-outline'; color = '#3B82F6'; bg = '#EFF6FF';
  } else if (doc.type === 'xlsx') {
    icon = 'file-excel-box'; color = '#10B981'; bg = '#ECFDF5';
  }

  return (
    <TouchableOpacity style={styles.docRow} onPress={onPress}>
      <View style={[styles.docIconContainer, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} color={color} size={22} />
      </View>
      <View style={styles.docInfo}>
        <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
        <Text style={styles.docMeta}>{doc.size} · {doc.status === 'processed' ? 'Processed & Indexed ✓' : 'Processing...'}</Text>
      </View>
      {doc.status === 'processing' ? (
        <ActivityIndicator size="small" color={AppColors.primary} />
      ) : (
        <MaterialCommunityIcons name="dots-vertical" color="#9CA3AF" size={20} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: { backgroundColor: AppColors.surface, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border, flexDirection: 'row', alignItems: 'center', height: 64 },
  menuButton: { marginRight: 16 },
  headerTextCol: { justifyContent: 'center' },
  headerTitle: { color: AppColors.textPrimary, fontSize: 18, fontWeight: '700' },
  headerSubtitle: { color: AppColors.textSecondary, fontSize: 12.5, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 32 },
  listHeader: { marginBottom: 10 },

  ragBanner: { flexDirection: 'row', backgroundColor: '#EEECFE', padding: 14, borderRadius: 14, marginBottom: 16, alignItems: 'center' },
  ragIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  ragTitle: { color: AppColors.primary, fontSize: 13.5, fontWeight: '700', marginBottom: 2 },
  ragSubtitle: { color: AppColors.textSecondary, fontSize: 11.5, lineHeight: 16 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, paddingHorizontal: 14, height: 44, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, color: AppColors.textPrimary, fontSize: 14 },
  sectionTitle: { color: AppColors.textSecondary, fontSize: 12.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  uploadRow: { flexDirection: 'row', marginTop: 8, marginBottom: 10 },
  uploadInput: { flex: 1, height: 46, backgroundColor: AppColors.surface, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: AppColors.border, marginRight: 8, color: AppColors.textPrimary, fontSize: 13.5 },
  uploadBtn: { flexDirection: 'row', backgroundColor: AppColors.primary, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  uploadBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  browseStorageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: AppColors.surface, borderWidth: 1, borderColor: `${AppColors.primary}50`, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 12, marginBottom: 6 },
  browseStorageBtnText: { color: AppColors.primary, fontSize: 13.5, fontWeight: '700', marginLeft: 8 },

  templatePresetsRow: { paddingVertical: 4, paddingBottom: 14, gap: 8 },
  templatePresetChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surface, borderWidth: 1, borderColor: AppColors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  templatePresetText: { color: AppColors.textPrimary, fontSize: 12.5, fontWeight: '600' },

  docsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 8 },
  docsCount: { color: '#9CA3AF', fontSize: 11.5, fontWeight: '600' },
  emptyContainer: { marginTop: 30, alignItems: 'center' },
  emptyText: { color: AppColors.textSecondary, fontSize: 13 },
  docRow: { flexDirection: 'row', backgroundColor: AppColors.surface, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 14, alignItems: 'center' },
  docIconContainer: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  docInfo: { flex: 1, justifyContent: 'center' },
  docName: { color: AppColors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 3 },
  docMeta: { color: '#9CA3AF', fontSize: 11.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: AppColors.surface, borderRadius: 20, padding: 20, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  modalIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#EEECFE', alignItems: 'center', justifyContent: 'center' },
  modalDocName: { fontSize: 15, fontWeight: '700', color: AppColors.textPrimary },
  modalDocMeta: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  modalSummaryText: { fontSize: 13, color: AppColors.textSecondary, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, lineHeight: 18, marginBottom: 16 },
  modalActionsList: { borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, overflow: 'hidden', marginBottom: 16 },
  modalActionItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: AppColors.border, backgroundColor: AppColors.surface },
  modalActionItemText: { flex: 1, marginLeft: 12, fontSize: 13.5, fontWeight: '600', color: AppColors.textPrimary },
  modalCloseBtn: { backgroundColor: '#F3F4F6', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalCloseBtnText: { color: AppColors.textSecondary, fontWeight: '700', fontSize: 13.5 },
});
