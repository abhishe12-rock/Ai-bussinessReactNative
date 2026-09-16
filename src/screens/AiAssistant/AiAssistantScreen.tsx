import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, AppShadows } from '../theme/AppColors';
import { FadeInUp } from '../theme/Animations';
import { AiService } from '../../services/AiService';
import { VoiceService } from '../../services/VoiceService';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  time?: string;
}

export default function AiAssistantScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // STT / Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [autoSpeakResponses, setAutoSpeakResponses] = useState(true);

  // TTS playback state
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  const scrollViewRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  // Animated keyboard height for smooth keyboard tracking on Android & iOS
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;

  // 18 Waveform bar animations for ChatGPT-style live audio visualizer
  const waveformAnims = useRef(
    Array.from({ length: 18 }, () => new Animated.Value(4))
  ).current;
  const waveformTimerRef = useRef<any>(null);

  // ----------------------------------------------------
  // KEYBOARD TRACKING
  // ----------------------------------------------------
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e.endCoordinates?.height || 0;
      setIsKeyboardVisible(true);
      const targetHeight = height + (Platform.OS === 'android' ? 40 : 22);
      Animated.timing(keyboardHeightAnim, {
        toValue: targetHeight,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 180,
        useNativeDriver: false,
      }).start();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setIsKeyboardVisible(false);
      Animated.timing(keyboardHeightAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 180,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeightAnim]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      VoiceService.stopSpeaking();
      VoiceService.stopListening();
      if (waveformTimerRef.current) clearInterval(waveformTimerRef.current);
    };
  }, []);

  // ----------------------------------------------------
  // WAVEFORM ANIMATION
  // ----------------------------------------------------
  const startWaveformAnimation = () => {
    if (waveformTimerRef.current) clearInterval(waveformTimerRef.current);
    waveformTimerRef.current = setInterval(() => {
      waveformAnims.forEach((anim) => {
        // Random natural fluctuating heights between 4 and 26
        const randomHeight = Math.floor(Math.random() * 22) + 4;
        Animated.timing(anim, {
          toValue: randomHeight,
          duration: 120,
          useNativeDriver: false,
        }).start();
      });
    }, 120);
  };

  const stopWaveformAnimation = () => {
    if (waveformTimerRef.current) {
      clearInterval(waveformTimerRef.current);
      waveformTimerRef.current = null;
    }
    waveformAnims.forEach((anim) => {
      Animated.timing(anim, {
        toValue: 4,
        duration: 150,
        useNativeDriver: false,
      }).start();
    });
  };

  // ----------------------------------------------------
  // SPEECH TO TEXT (STT) CONTROLS
  // ----------------------------------------------------
  const handleStartRecording = async (isVoiceMode: boolean = false) => {
    Keyboard.dismiss();
    VoiceService.stopSpeaking();
    setSpeakingMessageId(null);
    setSpokenTranscript('');
    setIsRecording(true);
    startWaveformAnimation();

    await VoiceService.startListening({
      onStart: () => {
        // Listening active
      },
      onResult: (transcript) => {
        setSpokenTranscript(transcript);
        setInputText(transcript);
      },
      onError: () => {
        // Error handling
      },
      onEnd: () => {
        // Recording ended
      },
    });
  };

  const handleStopRecording = async () => {
    stopWaveformAnimation();
    await VoiceService.stopListening();
    setIsRecording(false);
    // Keep whatever transcript was spoken in the input box so user can view/edit
    if (spokenTranscript.trim()) {
      setInputText(spokenTranscript.trim());
    }
  };

  const handleCancelRecording = async () => {
    stopWaveformAnimation();
    await VoiceService.cancelListening();
    setIsRecording(false);
    setSpokenTranscript('');
  };

  const handleSendVoiceRecording = async () => {
    stopWaveformAnimation();
    await VoiceService.stopListening();
    setIsRecording(false);
    const textToSend = spokenTranscript.trim() || inputText.trim();
    setSpokenTranscript('');
    if (textToSend) {
      handleSend(textToSend, true);
    }
  };

  // ----------------------------------------------------
  // TEXT TO SPEECH (TTS) CONTROLS
  // ----------------------------------------------------
  const handleToggleSpeakMessage = async (msg: Message) => {
    if (speakingMessageId === msg.id) {
      await VoiceService.stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      setSpeakingMessageId(msg.id);
      await VoiceService.speak(
        msg.text,
        msg.id,
        () => setSpeakingMessageId(msg.id),
        () => setSpeakingMessageId(null),
        () => setSpeakingMessageId(null)
      );
    }
  };

  // ----------------------------------------------------
  // SEND MESSAGE
  // ----------------------------------------------------
  const handleSend = async (textToSend?: string, shouldSpeakReply: boolean = false) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now().toString(), text, isUser: true, time: timeStr };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setSpokenTranscript('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const businessContext = await AiService.getBusinessContext();
      const response = await AiService.promptGemini(businessContext, text);

      const aiMsgId = (Date.now() + 1).toString();
      const aiMsg: Message = {
        id: aiMsgId,
        text: response,
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If auto-speak is enabled or this was a voice inquiry, speak response aloud
      if (shouldSpeakReply || autoSpeakResponses) {
        setSpeakingMessageId(aiMsgId);
        VoiceService.speak(
          response,
          aiMsgId,
          () => setSpeakingMessageId(aiMsgId),
          () => setSpeakingMessageId(null),
          () => setSpeakingMessageId(null)
        );
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${err.message || 'Could not fetch AI response'}`,
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const quickAsk = (q: string) => {
    handleSend(q);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
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

        <View style={styles.headerRight}>
          {speakingMessageId ? (
            <TouchableOpacity
              style={styles.speakingIndicatorBtn}
              onPress={() => {
                VoiceService.stopSpeaking();
                setSpeakingMessageId(null);
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="volume-high" color={AppColors.primary} size={18} />
              <Text style={styles.speakingIndicatorText}>Speaking</Text>
              <MaterialCommunityIcons name="stop-circle" color={AppColors.primary} size={16} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.speakerToggleBtn, autoSpeakResponses && styles.speakerToggleBtnActive]}
              onPress={() => setAutoSpeakResponses((prev) => !prev)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={autoSpeakResponses ? 'volume-high' : 'volume-off'}
                size={20}
                color={autoSpeakResponses ? AppColors.primary : AppColors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* DYNAMIC ANIMATED CONTAINER - SECURELY TRACKS KEYBOARD ON ANDROID & IOS */}
      <Animated.View style={[styles.mainChatWrapper, { paddingBottom: keyboardHeightAnim }]}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View>
              <FadeInUp delay={30}>
                <View style={styles.greetingCard}>
                  <View style={styles.greetingIconBox}>
                    <MaterialCommunityIcons name="robot-outline" color={AppColors.primary} size={20} />
                  </View>
                  <Text style={styles.greetingText}>
                    Hi! I'm your live business assistant. Ask me anything about your sales, inventory, repairs, customers, documents, or finances.
                  </Text>
                </View>
              </FadeInUp>

              <Text style={styles.quickActionsTitle}>Quick questions</Text>
              <View style={styles.quickGrid}>
                <QuickActionBtn
                  label="How are sales this month?"
                  onPress={() => quickAsk('How are sales this month?')}
                />
                <QuickActionBtn
                  label="Which product sold the most?"
                  onPress={() => quickAsk('Which product sold the most units?')}
                />
                <QuickActionBtn
                  label="How much money is pending?"
                  onPress={() => quickAsk('How much money is pending from customers?')}
                />
                <QuickActionBtn
                  label="What products are low on stock?"
                  onPress={() => quickAsk('What products are low on stock?')}
                />
                <QuickActionBtn
                  label="How many repairs are pending?"
                  onPress={() => quickAsk('How many repairs are pending?')}
                />
                <QuickActionBtn
                  label="What is our net profit this month?"
                  onPress={() => quickAsk('What is our net profit this month?')}
                />
              </View>
            </View>
          ) : (
            <View style={styles.chatContainer}>
              {messages.map((msg, index) => (
                <FadeInUp key={msg.id} delay={index * 20}>
                  <View
                    style={[
                      styles.bubbleWrapper,
                      msg.isUser ? styles.userBubbleWrap : styles.aiBubbleWrap,
                    ]}
                  >
                    {!msg.isUser && (
                      <View style={styles.bubbleIcon}>
                        <MaterialCommunityIcons name="robot-outline" color={AppColors.primary} size={16} />
                      </View>
                    )}
                    <View style={[styles.bubble, msg.isUser ? styles.userBubble : styles.aiBubble]}>
                      <Text style={[styles.bubbleText, msg.isUser && styles.userBubbleText]}>
                        {msg.text}
                      </Text>
                      
                      <View style={styles.bubbleFooter}>
                        {/* TTS Play/Stop Button on AI responses */}
                        {!msg.isUser && (
                          <TouchableOpacity
                            style={styles.ttsButton}
                            onPress={() => handleToggleSpeakMessage(msg)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialCommunityIcons
                              name={speakingMessageId === msg.id ? 'stop-circle' : 'volume-high'}
                              size={17}
                              color={speakingMessageId === msg.id ? AppColors.primary : AppColors.textMuted}
                            />
                            {speakingMessageId === msg.id && (
                              <Text style={styles.ttsPlayingLabel}>Playing</Text>
                            )}
                          </TouchableOpacity>
                        )}

                        {msg.time && (
                          <Text style={[styles.timeText, msg.isUser ? styles.userTimeText : styles.aiTimeText]}>
                            {msg.time}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                </FadeInUp>
              ))}

              {isLoading && (
                <FadeInUp delay={20}>
                  <View style={styles.loadingWrap}>
                    <ActivityIndicator color={AppColors.primary} size="small" />
                    <Text style={styles.loadingWaitingText}>Analyzing live business telemetry...</Text>
                  </View>
                </FadeInUp>
              )}
            </View>
          )}
        </ScrollView>

        {/* CHATGPT STYLE INPUT BAR - FLOATS DIRECTLY ABOVE THE KEYBOARD */}
        <View
          style={[
            styles.inputBarWrapper,
            {
              paddingBottom: isKeyboardVisible ? 20 : Math.max(insets.bottom, 14),
            },
          ]}
        >
          {isRecording ? (
            /* CHATGPT STYLE ACTIVE VOICE RECORDING PILL */
            <View style={styles.voiceRecordingPill}>
              {/* CANCEL (X) BUTTON */}
              <TouchableOpacity
                style={styles.voiceCancelButton}
                onPress={handleCancelRecording}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              {/* ANIMATED SOUND WAVEFORM VISUALIZER */}
              <View style={styles.waveformRow}>
                {waveformAnims.map((anim, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.waveformBar,
                      {
                        height: anim,
                      },
                    ]}
                  />
                ))}
              </View>

              {/* STOP SQUARE BUTTON */}
              <TouchableOpacity
                style={styles.voiceStopButton}
                onPress={handleStopRecording}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="square" size={14} color="#FFFFFF" />
              </TouchableOpacity>

              {/* SEND UP ARROW BUTTON */}
              <TouchableOpacity
                style={styles.voiceSendButton}
                onPress={handleSendVoiceRecording}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="arrow-up" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            /* NORMAL CHATGPT STYLE INPUT PILL WITH MIC & VOICE BUTTON */
            <View style={styles.inputBarPill}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={() => quickAsk('Give me a full business performance summary.')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="plus" size={22} color={AppColors.textSecondary} />
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                style={styles.inputField}
                placeholder="Ask AI Assistant..."
                placeholderTextColor={AppColors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
                multiline
                maxLength={600}
              />

              {/* MICROPHONE BUTTON INSIDE TEXT BOX (SPEECH TO TEXT) */}
              <TouchableOpacity
                style={styles.pillMicButton}
                onPress={() => handleStartRecording(false)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="microphone-outline" size={22} color={AppColors.textSecondary} />
              </TouchableOpacity>

              {/* RIGHT ACTION: If typing -> Send Button; If empty -> Soundwave Voice Mode Button */}
              {inputText.trim().length === 0 ? (
                <TouchableOpacity
                  style={styles.voiceModeButton}
                  onPress={() => handleStartRecording(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="waveform" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={() => handleSend()}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="arrow-up" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const QuickActionBtn = ({ label, onPress }: { label: string; onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.quickBtnText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  mainChatWrapper: {
    flex: 1,
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
    minHeight: 56,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuButton: {
    marginRight: 12,
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
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: AppColors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakingIndicatorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
  },
  speakingIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
  speakerToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerToggleBtnActive: {
    backgroundColor: '#EEECFE',
    borderColor: '#C7D2FE',
  },

  /* SCROLL & CHAT */
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  greetingCard: {
    flexDirection: 'row',
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    marginBottom: 20,
    alignItems: 'flex-start',
    ...AppShadows.card,
  },
  greetingIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEECFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  greetingText: {
    flex: 1,
    color: AppColors.textPrimary,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  quickActionsTitle: {
    color: AppColors.textMuted,
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    ...AppShadows.subtle,
  },
  quickBtnText: {
    color: AppColors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  userBubbleWrap: {
    justifyContent: 'flex-end',
  },
  aiBubbleWrap: {
    justifyContent: 'flex-start',
  },
  bubbleIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEECFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    ...AppShadows.card,
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
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    minHeight: 20,
  },
  ttsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 8,
    gap: 4,
  },
  ttsPlayingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.primary,
  },
  timeText: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  aiTimeText: {
    color: AppColors.textMuted,
  },
  loadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 38,
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
    fontWeight: '600',
  },

  /* CHATGPT STYLE INPUT BAR */
  inputBarWrapper: {
    backgroundColor: AppColors.surface,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    paddingHorizontal: 14,
    paddingTop: 10,
    ...AppShadows.card,
  },
  inputBarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 26,
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 6 : 4,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    minHeight: 52,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
    maxHeight: 120,
    lineHeight: 20,
  },
  pillMicButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  voiceModeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7', // Vibrant ChatGPT voice blue
    alignItems: 'center',
    justifyContent: 'center',
    ...AppShadows.glow,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...AppShadows.glow,
  },

  /* CHATGPT ACTIVE VOICE RECORDING PILL */
  voiceRecordingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181B', // Modern dark capsule
    borderRadius: 28,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 54,
  },
  voiceCancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3.5,
    height: 32,
    marginHorizontal: 10,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#F4F4F5',
    borderRadius: 2,
  },
  voiceStopButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  voiceSendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
