import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform, ActivityIndicator, KeyboardAvoidingView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors } from '../theme/AppColors';
import { AiService } from '../../services/AiService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function AiAssistantScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<any>(null);

  const handleSend = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), text: text.trim(), isUser: true };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const businessContext = await AiService.getBusinessContext();
      const response = await AiService.promptGemini(
        businessContext,
        text.trim()
      );
      
      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response, isUser: false };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), text: `Error: ${err.message}`, isUser: false };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickAsk = (q: string) => {
    handleSend(q);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ marginRight: 12 }}>
            <MaterialCommunityIcons name="menu" size={24} color={AppColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerIconBox}>
            <MaterialCommunityIcons name="robot-outline" color={AppColors.primary} size={22} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Ask anything about your business</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 ? (
            <View>
              <View style={styles.greetingCard}>
                <View style={styles.greetingIconBox}>
                  <MaterialCommunityIcons name="robot-outline" color={AppColors.primary} size={18} />
                </View>
                <Text style={styles.greetingText}>
                  Hi! I'm your live business assistant. Ask me anything about your sales, inventory, repairs, customers, or finances.
                </Text>
              </View>

              <Text style={styles.quickActionsTitle}>Quick questions</Text>
              <View style={styles.quickGrid}>
                <QuickActionBtn label="How are sales this month?" onPress={() => quickAsk("How are sales this month?")} />
                <QuickActionBtn label="Which product sold the most?" onPress={() => quickAsk("Which product sold the most units?")} />
                <QuickActionBtn label="How much money is pending?" onPress={() => quickAsk("How much money is pending from customers?")} />
                <QuickActionBtn label="What products are low on stock?" onPress={() => quickAsk("What products are low on stock?")} />
                <QuickActionBtn label="How many repairs are pending?" onPress={() => quickAsk("How many repairs are pending?")} />
                <QuickActionBtn label="What is our net profit this month?" onPress={() => quickAsk("What is our net profit this month?")} />
              </View>
            </View>
          ) : (
            <View style={styles.chatContainer}>
              {messages.map(msg => (
                <View key={msg.id} style={[styles.bubbleWrapper, msg.isUser ? styles.userBubbleWrap : styles.aiBubbleWrap]}>
                  {!msg.isUser && (
                    <View style={styles.bubbleIcon}>
                      <MaterialCommunityIcons name="robot-outline" color={AppColors.primary} size={15} />
                    </View>
                  )}
                  <View style={[styles.bubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
                    <Text style={[styles.bubbleText, msg.isUser && styles.userBubbleText]}>{msg.text}</Text>
                  </View>
                </View>
              ))}
              {isLoading && (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={AppColors.primary} size="small" />
                  <Text style={styles.loadingWaitingText}>Analyzing business data...</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Chat Input Bar */}
        <View style={[
          styles.inputBarWrapper, 
          { 
            paddingBottom: Math.max(insets.bottom, 12) 
          }
        ]}>
          <View style={styles.inputBar}>
            <View style={styles.inputContainer}>
              <TextInput 
                style={styles.input} 
                placeholder="Ask me anything..."
                placeholderTextColor={AppColors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                multiline
                maxLength={500}
              />
            </View>
            {inputText.trim().length === 0 ? (
              <TouchableOpacity style={styles.micButton} onPress={() => quickAsk("Give me a full business performance summary.")}>
                <MaterialCommunityIcons name="auto-fix" size={22} color={AppColors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
                <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const QuickActionBtn = ({ label, onPress }: { label: string; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Text style={styles.quickBtnText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    backgroundColor: AppColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEECFE', 
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextCol: {
    justifyContent: 'center',
  },
  headerTitle: {
    color: AppColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  greetingCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 14,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  greetingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#EEECFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  greetingText: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 13.5,
    lineHeight: 19,
  },
  quickActionsTitle: {
    color: AppColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickBtn: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickBtnText: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
    paddingBottom: 16,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userBubbleWrap: {
    justifyContent: 'flex-end',
  },
  aiBubbleWrap: {
    justifyContent: 'flex-start',
  },
  bubbleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEECFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textPrimary,
  },
  userBubbleText: {
    color: '#FFF',
    fontWeight: '500',
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 36,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignSelf: 'flex-start',
  },
  loadingWaitingText: {
    marginLeft: 8,
    fontSize: 12.5,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  inputBarWrapper: {
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingHorizontal: 14,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.background, 
    borderRadius: 22,
    paddingHorizontal: 16,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  input: {
    flex: 1,
    fontSize: 14.5,
    color: AppColors.textPrimary,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: `${AppColors.primary}30`,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
