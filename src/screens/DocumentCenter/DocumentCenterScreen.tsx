import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { AppColors, AppShadows } from '../theme/AppColors';
import { FadeInUp, SpringTouch } from '../theme/Animations';
import { AiService, type DocumentKnowledge } from '../../services/AiService';

const PRESET_TEMPLATES = [
  { name: 'Company Policy.pdf', size: '2.4 MB', type: 'pdf' as const },
  { name: 'Employee Handbook.pdf', size: '5.1 MB', type: 'pdf' as const },
  { name: 'Repair Manual.pdf', size: '8.2 MB', type: 'pdf' as const },
  { name: 'Product Price List.xlsx', size: '1.2 MB', type: 'xlsx' as const },
  { name: 'Warranty Policy.pdf', size: '1.8 MB', type: 'pdf' as const },
  { name: 'Product Catalogue.pdf', size: '3.4 MB', type: 'pdf' as const },
  { name: 'Terms & Conditions.pdf', size: '1.5 MB', type: 'pdf' as const },
];

export default function DocumentCenterScreen() {
  const navigation = useNavigation<any>();
  const [docs, setDocs] = useState<DocumentKnowledge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAskAiModalOpen, setIsAskAiModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentKnowledge | null>(null);

  // Upload Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState('');

  // Ask AI State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSourceDoc, setAiSourceDoc] = useState<string | null>(null);
  const [aiChunksUsed, setAiChunksUsed] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load documents
  const loadDocs = useCallback(() => {
    const library = AiService.getDocumentLibrary();
    setDocs(library);
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docs;
    const q = searchQuery.toLowerCase();
    return docs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.chunks.some((c) => c.toLowerCase().includes(q))
    );
  }, [docs, searchQuery]);

  /* ============================================================
  UPLOAD NEW DOCUMENT
  ============================================================ */
  const handleUploadDocument = async (name: string, contentText?: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter a valid document name.');
      return;
    }

    const docFileName = trimmedName.includes('.') ? trimmedName : `${trimmedName}.pdf`;
    setIsUploading(true);
    setUploadStep('Extracting text content...');

    setTimeout(() => {
      setUploadStep('Splitting into semantic chunks...');
      setTimeout(() => {
        setUploadStep('Generating vector embeddings for AI RAG...');
        setTimeout(() => {
          const docType: any = docFileName.endsWith('.xlsx')
            ? 'xlsx'
            : docFileName.endsWith('.docx')
            ? 'docx'
            : 'pdf';

          const sampleChunks = contentText
            ? contentText
                .split('\n\n')
                .filter((p) => p.trim().length > 0)
                .map((p) => p.trim())
            : [
                `DOCUMENT: ${docFileName}. Extracted knowledge and guidelines for enterprise operations.`,
                `PROCEDURES: Standard company rules and operational directives outlined in ${docFileName}.`,
              ];

          const newDoc: DocumentKnowledge = {
            id: `doc-${Date.now()}`,
            name: docFileName,
            type: docType,
            size: '2.4 MB',
            date: 'Just indexed',
            status: 'processed',
            summary: `Vectorized document knowledge for ${docFileName}. Ready for AI assistant questions.`,
            chunks: sampleChunks.length > 0 ? sampleChunks : [`Content extracted for ${docFileName}.`],
          };

          AiService.addDetailedDocument(newDoc);
          loadDocs();
          setIsUploading(false);
          setIsUploadModalOpen(false);
          setNewDocName('');
          setNewDocContent('');
          Alert.alert('Success', `"${docFileName}" has been processed and stored in the AI RAG Knowledge Base!`);
        }, 800);
      }, 700);
    }, 600);
  };

  /* ============================================================
  DOCUMENT ACTIONS
  ============================================================ */
  const handleOpenAskAi = (doc?: DocumentKnowledge) => {
    setSelectedDoc(doc || null);
    setAiQuestion(
      doc
        ? doc.name.includes('Policy')
          ? 'What is our employee leave policy?'
          : doc.name.includes('Repair')
          ? 'What is the procedure for replacing an iPhone display?'
          : doc.name.includes('Price')
          ? 'What is the wholesale price for Boat Airdopes 141?'
          : doc.name.includes('Warranty')
          ? 'What are our repair warranty terms?'
          : `What key guidelines are in ${doc.name}?`
        : 'What is our company policy on employee leaves and overtime?'
    );
    setAiAnswer(null);
    setAiSourceDoc(null);
    setAiChunksUsed([]);
    setIsAskAiModalOpen(true);
  };

  const handleAskAiSubmit = async () => {
    if (!aiQuestion.trim()) return;
    setIsAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await AiService.queryDocumentRag(aiQuestion, selectedDoc?.id || selectedDoc?.name);
      setAiAnswer(res.answer);
      setAiSourceDoc(res.sourceDoc);
      setAiChunksUsed(res.chunksUsed);
    } catch (err: any) {
      setAiAnswer(`Error generating RAG response: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleReprocessDoc = (doc: DocumentKnowledge) => {
    Alert.alert('Reprocess Document', `Re-extract text and generate fresh embeddings for "${doc.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reprocess',
        onPress: () => {
          AiService.reprocessDocument(doc.id);
          loadDocs();
          Alert.alert('Processed', `"${doc.name}" has been re-indexed into vector memory!`);
        },
      },
    ]);
  };

  const handleDeleteDoc = (doc: DocumentKnowledge) => {
    Alert.alert('Delete Document', `Remove "${doc.name}" from the AI Knowledge Library?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          AiService.deleteDocument(doc.id);
          loadDocs();
        },
      },
    ]);
  };

  const getDocTypeIcon = (type: string) => {
    switch (type) {
      case 'xlsx':
        return { icon: 'file-excel-box', color: '#10B981', bg: '#D1FAE5' };
      case 'docx':
        return { icon: 'file-word-box', color: '#3B82F6', bg: '#EFF6FF' };
      case 'pdf':
      default:
        return { icon: 'file-pdf-box', color: '#EF4444', bg: '#FEE2E2' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.iconBtn}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="menu" size={22} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Document Center</Text>
            <Text style={styles.headerSubtitle}>Documents + RAG Knowledge</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.uploadHeaderBtn}
          onPress={() => setIsUploadModalOpen(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.uploadHeaderBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* RAG KNOWLEDGE BANNER */}
        <FadeInUp delay={20}>
          <View style={styles.ragBanner}>
            <View style={styles.ragBannerInner}>
              <View style={styles.ragIconWrap}>
                <MaterialCommunityIcons name="brain" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ragBannerTitle}>AI Knowledge Library</Text>
                <Text style={styles.ragBannerSubtitle}>
                  Give your AI business knowledge (policies, manuals, catalogues & price lists) not stored in normal databases.
                </Text>
              </View>
            </View>

            {/* Visual RAG Pipeline Bar */}
            <View style={styles.ragPipelineRow}>
              <View style={styles.pipelineStep}>
                <Text style={styles.pipelineStepText}>1. Extract Text</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
              <View style={styles.pipelineStep}>
                <Text style={styles.pipelineStepText}>2. Split Chunks</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
              <View style={styles.pipelineStep}>
                <Text style={styles.pipelineStepText}>3. Embeddings</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color="rgba(255,255,255,0.6)" />
              <View style={[styles.pipelineStep, { backgroundColor: 'rgba(16, 185, 129, 0.35)' }]}>
                <Text style={[styles.pipelineStepText, { color: '#A7F3D0' }]}>4. AI Search ✓</Text>
              </View>
            </View>
          </View>
        </FadeInUp>

        {/* SEARCH BAR & GLOBAL ASK AI BUTTON */}
        <FadeInUp delay={40}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color={AppColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search documents & knowledge..."
                placeholderTextColor={AppColors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={AppColors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.askAiGlobalBtn}
              onPress={() => handleOpenAskAi()}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="auto-awesome" size={18} color={AppColors.primary} />
              <Text style={styles.askAiGlobalBtnText}>Ask AI</Text>
            </TouchableOpacity>
          </View>
        </FadeInUp>

        {/* SECTION HEADER */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Stored Documents ({filteredDocs.length})</Text>
          <Text style={styles.sectionCaption}>Ready for AI Retrieval</Text>
        </View>

        {/* DOCUMENT CARDS LIST */}
        {filteredDocs.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="file-document-outline" size={44} color={AppColors.textMuted} />
            <Text style={styles.emptyTitle}>No documents found</Text>
            <Text style={styles.emptySubtitle}>Upload a business document or spreadsheet to empower your AI.</Text>
            <TouchableOpacity
              style={styles.uploadEmptyBtn}
              onPress={() => setIsUploadModalOpen(true)}
            >
              <Text style={styles.uploadEmptyBtnText}>+ Upload Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredDocs.map((doc, index) => {
            const typeInfo = getDocTypeIcon(doc.type);
            return (
              <FadeInUp key={doc.id} delay={60 + index * 35}>
                <View style={styles.docCard}>
                  <View style={styles.docTopRow}>
                    <View style={[styles.docIconWrap, { backgroundColor: typeInfo.bg }]}>
                      <MaterialCommunityIcons name={typeInfo.icon} size={24} color={typeInfo.color} />
                    </View>

                    <View style={styles.docInfoCol}>
                      <Text style={styles.docName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <View style={styles.docMetaRow}>
                        <Text style={styles.docSize}>{doc.size}</Text>
                        <Text style={styles.docMetaDot}>•</Text>
                        <View style={styles.processedBadge}>
                          <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" />
                          <Text style={styles.processedText}>Processed ✓</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.docSummary} numberOfLines={2}>
                    {doc.summary}
                  </Text>

                  {/* DOCUMENT ACTION BUTTONS */}
                  <View style={styles.docActionRow}>
                    <TouchableOpacity
                      style={styles.askAiChip}
                      onPress={() => handleOpenAskAi(doc)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="auto-awesome" size={14} color="#5B4DF8" />
                      <Text style={styles.askAiChipText}>Ask AI</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionChip}
                      onPress={() => {
                        setSelectedDoc(doc);
                        setIsViewModalOpen(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={14} color={AppColors.textSecondary} />
                      <Text style={styles.actionChipText}>View</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionChip}
                      onPress={() => handleReprocessDoc(doc)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="sync" size={14} color={AppColors.textSecondary} />
                      <Text style={styles.actionChipText}>Reprocess</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionChip, styles.deleteChip]}
                      onPress={() => handleDeleteDoc(doc)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </FadeInUp>
            );
          })
        )}
      </ScrollView>

      {/* ============================================================
      MODAL 1: UPLOAD DOCUMENT / SELECT TEMPLATE
      ============================================================ */}
      <Modal
        visible={isUploadModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!isUploading) setIsUploadModalOpen(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Upload Document</Text>
                <Text style={styles.modalSubtitle}>Feed knowledge to the AI RAG Knowledge Base</Text>
              </View>
              {!isUploading && (
                <TouchableOpacity onPress={() => setIsUploadModalOpen(false)}>
                  <MaterialCommunityIcons name="close" size={22} color={AppColors.textPrimary} />
                </TouchableOpacity>
              )}
            </View>

            {isUploading ? (
              <View style={styles.uploadingBox}>
                <ActivityIndicator size="large" color={AppColors.primary} />
                <Text style={styles.uploadingStepText}>{uploadStep}</Text>
                <Text style={styles.uploadingHintText}>Creating semantic chunks and vector embeddings...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSectionLabel}>CHOOSE PRESET TEMPLATE</Text>
                <View style={styles.templatesGrid}>
                  {PRESET_TEMPLATES.map((tmpl) => (
                    <TouchableOpacity
                      key={tmpl.name}
                      style={styles.templateItem}
                      onPress={() => handleUploadDocument(tmpl.name)}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons
                        name={tmpl.type === 'xlsx' ? 'file-excel-box' : 'file-pdf-box'}
                        size={20}
                        color={tmpl.type === 'xlsx' ? '#10B981' : '#EF4444'}
                      />
                      <Text style={styles.templateName} numberOfLines={1}>
                        {tmpl.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.modalSectionLabel, { marginTop: 18 }]}>OR CREATE CUSTOM DOCUMENT</Text>
                <TextInput
                  style={styles.inputField}
                  placeholder="Document Name (e.g. Return Policy.pdf)"
                  placeholderTextColor={AppColors.textMuted}
                  value={newDocName}
                  onChangeText={setNewDocName}
                />

                <TextInput
                  style={[styles.inputField, styles.textArea]}
                  placeholder="Paste document text or standard operating guidelines here..."
                  placeholderTextColor={AppColors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={newDocContent}
                  onChangeText={setNewDocContent}
                />

                <TouchableOpacity
                  style={styles.submitUploadBtn}
                  onPress={() => handleUploadDocument(newDocName, newDocContent)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="cloud-upload" size={18} color="#FFFFFF" />
                  <Text style={styles.submitUploadBtnText}>Process & Vectorize for AI</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================================
      MODAL 2: ASK AI ABOUT DOCUMENT (RAG Q&A)
      ============================================================ */}
      <Modal
        visible={isAskAiModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAskAiModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={styles.askAiHeaderTag}>
                  <MaterialCommunityIcons name="auto-awesome" size={14} color="#5B4DF8" />
                  <Text style={styles.askAiHeaderTagText}>
                    {selectedDoc ? selectedDoc.name : 'All Company Documents'}
                  </Text>
                </View>
                <Text style={styles.modalTitle}>RAG AI Knowledge Query</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAskAiModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionLabel}>YOUR QUESTION</Text>
              <View style={styles.askAiInputWrap}>
                <TextInput
                  style={styles.askAiInput}
                  placeholder="Ask any question from the document..."
                  placeholderTextColor={AppColors.textMuted}
                  multiline
                  value={aiQuestion}
                  onChangeText={setAiQuestion}
                />
                <TouchableOpacity
                  style={[styles.askAiSubmitBtn, isAiLoading && { opacity: 0.6 }]}
                  onPress={handleAskAiSubmit}
                  disabled={isAiLoading}
                  activeOpacity={0.8}
                >
                  {isAiLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
                      <Text style={styles.askAiSubmitBtnText}>Query RAG</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Sample Prompts */}
              <View style={styles.samplePromptsRow}>
                <TouchableOpacity
                  style={styles.promptChip}
                  onPress={() => setAiQuestion('What is our employee leave policy?')}
                >
                  <Text style={styles.promptChipText}>Leave policy?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.promptChip}
                  onPress={() => setAiQuestion('What is the procedure for replacing an iPhone display?')}
                >
                  <Text style={styles.promptChipText}>iPhone repair steps?</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.promptChip}
                  onPress={() => setAiQuestion('What are our warranty terms on repairs?')}
                >
                  <Text style={styles.promptChipText}>Warranty terms?</Text>
                </TouchableOpacity>
              </View>

              {/* AI ANSWER RESULT BOX */}
              {isAiLoading ? (
                <View style={styles.aiLoadingBox}>
                  <ActivityIndicator color={AppColors.primary} size="large" />
                  <Text style={styles.aiLoadingText}>Searching document chunks & synthesizing answer...</Text>
                </View>
              ) : aiAnswer ? (
                <View style={styles.aiAnswerCard}>
                  <View style={styles.aiAnswerHeader}>
                    <View style={styles.aiAnswerIcon}>
                      <MaterialCommunityIcons name="robot" size={18} color="#5B4DF8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.aiAnswerTitle}>AI RAG Grounded Answer</Text>
                      <Text style={styles.aiAnswerSource}>Source: {aiSourceDoc}</Text>
                    </View>
                  </View>

                  <Text style={styles.aiAnswerText}>{aiAnswer}</Text>

                  {aiChunksUsed.length > 0 && (
                    <View style={styles.chunksUsedBox}>
                      <Text style={styles.chunksUsedTitle}>RETRIEVED DOCUMENT EXCERPT:</Text>
                      {aiChunksUsed.map((chunk, idx) => (
                        <Text key={idx} style={styles.chunkText}>
                          "{chunk}"
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================================
      MODAL 3: VIEW EXTRACTED DOCUMENT CHUNKS
      ============================================================ */}
      <Modal
        visible={isViewModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsViewModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedDoc?.name}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDoc?.size} • {selectedDoc?.chunks.length || 0} Vector Chunks Extracted
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsViewModalOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={AppColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionLabel}>SUMMARY</Text>
              <Text style={styles.viewSummaryText}>{selectedDoc?.summary}</Text>

              <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>
                INDEXED CHUNKS ({selectedDoc?.chunks.length || 0})
              </Text>
              {selectedDoc?.chunks.map((chunk, index) => (
                <View key={index} style={styles.chunkCard}>
                  <View style={styles.chunkIndexBadge}>
                    <Text style={styles.chunkIndexText}>Chunk #{index + 1}</Text>
                  </View>
                  <Text style={styles.chunkBodyText}>{chunk}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.askAiFromViewBtn}
                onPress={() => {
                  setIsViewModalOpen(false);
                  setTimeout(() => handleOpenAskAi(selectedDoc || undefined), 300);
                }}
              >
                <MaterialCommunityIcons name="auto-awesome" size={18} color="#FFFFFF" />
                <Text style={styles.askAiFromViewBtnText}>Ask AI About This Document</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },

  /* HEADER */
  header: {
    backgroundColor: AppColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  headerTextGroup: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  uploadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    ...AppShadows.subtle,
  },
  uploadHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },

  /* RAG BANNER */
  ragBanner: {
    backgroundColor: '#5B4DF8',
    borderRadius: 18,
    padding: 18,
    ...AppShadows.glow,
    marginBottom: 16,
  },
  ragBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  ragIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ragBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  ragBannerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    lineHeight: 16,
  },
  ragPipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  pipelineStep: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pipelineStepText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  /* SEARCH & GLOBAL ASK AI */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: AppColors.textPrimary,
    paddingVertical: 0,
  },
  askAiGlobalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: AppColors.primarySoft,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(91,77,248,0.2)',
  },
  askAiGlobalBtnText: {
    color: AppColors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  /* SECTION HEADER */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  sectionCaption: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.textMuted,
  },

  /* DOCUMENT CARDS */
  docCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    marginBottom: 12,
    ...AppShadows.card,
  },
  docTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoCol: {
    flex: 1,
  },
  docName: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 3,
  },
  docMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docSize: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  docMetaDot: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  processedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  processedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  docSummary: {
    fontSize: 12.5,
    color: AppColors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  docActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  askAiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  askAiChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.surfaceSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
  },
  deleteChip: {
    backgroundColor: '#FEF2F2',
    marginLeft: 'auto',
  },

  /* EMPTY CARD */
  emptyCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AppColors.border,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  uploadEmptyBtn: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadEmptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 20,
    ...AppShadows.card,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: AppColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  /* TEMPLATES GRID */
  templatesGrid: {
    gap: 8,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: AppColors.surfaceSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.textPrimary,
    flex: 1,
  },

  /* INPUTS */
  inputField: {
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: AppColors.textPrimary,
    marginBottom: 10,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  submitUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
    ...AppShadows.subtle,
  },
  submitUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  uploadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingStepText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primary,
  },
  uploadingHintText: {
    marginTop: 4,
    fontSize: 12,
    color: AppColors.textMuted,
  },

  /* ASK AI MODAL */
  askAiHeaderTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AppColors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  askAiHeaderTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
  },
  askAiInputWrap: {
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 10,
    marginBottom: 10,
  },
  askAiInput: {
    fontSize: 14,
    color: AppColors.textPrimary,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  askAiSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  askAiSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  samplePromptsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  promptChip: {
    backgroundColor: '#EEECFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  promptChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: AppColors.primary,
  },
  aiLoadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLoadingText: {
    marginTop: 10,
    fontSize: 12.5,
    color: AppColors.textSecondary,
  },
  aiAnswerCard: {
    backgroundColor: '#F8F9FE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(91,77,248,0.25)',
    padding: 14,
    marginTop: 8,
  },
  aiAnswerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(91,77,248,0.12)',
  },
  aiAnswerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAnswerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: AppColors.textPrimary,
  },
  aiAnswerSource: {
    fontSize: 11,
    color: AppColors.primary,
    fontWeight: '600',
  },
  aiAnswerText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: AppColors.textPrimary,
  },
  chunksUsedBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  chunksUsedTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: AppColors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chunkText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: AppColors.textSecondary,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 4,
  },

  /* VIEW CHUNKS MODAL */
  viewSummaryText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 18,
    backgroundColor: AppColors.surfaceSoft,
    padding: 10,
    borderRadius: 10,
  },
  chunkCard: {
    backgroundColor: AppColors.surfaceSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    marginBottom: 8,
  },
  chunkIndexBadge: {
    backgroundColor: AppColors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  chunkIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
  },
  chunkBodyText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: AppColors.textPrimary,
  },
  askAiFromViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: AppColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  askAiFromViewBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
