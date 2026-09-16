import {
  PermissionsAndroid,
  Platform,
  NativeModules,
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native';

const { NativeVoice } = NativeModules;

export interface VoiceServiceCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onVolume?: (volume: number) => void;
}

export class VoiceService {
  private static isSpeaking: boolean = false;
  private static currentSpeakingId: string | null = null;
  private static subscriptions: EmitterSubscription[] = [];

  // ----------------------------------------------------
  // TEXT TO SPEECH (TTS)
  // ----------------------------------------------------
  static async speak(
    text: string,
    messageId?: string,
    onStart?: () => void,
    onDone?: () => void,
    onError?: () => void
  ): Promise<void> {
    try {
      await this.stopSpeaking();

      // Clean markdown symbols before speaking
      const cleanedText = text
        .replace(/[*_~`#|>[\]()]/g, ' ')
        .replace(/-{3,}/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanedText) return;

      const utteranceId = messageId || `utt_${Date.now()}`;
      this.isSpeaking = true;
      this.currentSpeakingId = messageId || null;

      // Listen for TTS events from native module
      const startSub = DeviceEventEmitter.addListener('onTtsStart', (e) => {
        if (e?.utteranceId === utteranceId) {
          this.isSpeaking = true;
          onStart?.();
        }
      });

      const doneSub = DeviceEventEmitter.addListener('onTtsDone', (e) => {
        if (e?.utteranceId === utteranceId) {
          this.isSpeaking = false;
          this.currentSpeakingId = null;
          startSub.remove();
          doneSub.remove();
          errorSub.remove();
          onDone?.();
        }
      });

      const errorSub = DeviceEventEmitter.addListener('onTtsError', (e) => {
        if (e?.utteranceId === utteranceId) {
          this.isSpeaking = false;
          this.currentSpeakingId = null;
          startSub.remove();
          doneSub.remove();
          errorSub.remove();
          onError?.();
        }
      });

      if (NativeVoice && NativeVoice.speak) {
        await NativeVoice.speak(cleanedText, utteranceId);
      } else {
        // Fallback simulation if running without native module
        onStart?.();
        const wordCount = cleanedText.split(/\s+/).length;
        const durationMs = Math.max(2000, Math.min(10000, (wordCount / 2.5) * 1000));
        setTimeout(() => {
          this.isSpeaking = false;
          this.currentSpeakingId = null;
          onDone?.();
        }, durationMs);
      }
    } catch (e) {
      this.isSpeaking = false;
      this.currentSpeakingId = null;
      onError?.();
    }
  }

  static async stopSpeaking(): Promise<void> {
    try {
      this.isSpeaking = false;
      this.currentSpeakingId = null;
      if (NativeVoice && NativeVoice.stopSpeaking) {
        await NativeVoice.stopSpeaking();
      }
    } catch (e) {
      // Ignore
    }
  }

  static getSpeakingMessageId(): string | null {
    return this.isSpeaking ? this.currentSpeakingId : null;
  }

  // ----------------------------------------------------
  // SPEECH TO TEXT (STT)
  // ----------------------------------------------------
  static async requestMicrophonePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'AI Assistant needs microphone access to convert your voice to text.',
            buttonNeutral: 'Ask Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    }
    return true;
  }

  static async startListening(callbacks: VoiceServiceCallbacks): Promise<boolean> {
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      callbacks.onError?.('Microphone permission denied.');
      return false;
    }

    try {
      this.cleanSubscriptions();

      // Register STT listeners
      this.subscriptions.push(
        DeviceEventEmitter.addListener('onSpeechStart', () => {
          callbacks.onStart?.();
        }),
        DeviceEventEmitter.addListener('onSpeechResults', (event) => {
          const text = event?.value || '';
          callbacks.onResult?.(text, true);
        }),
        DeviceEventEmitter.addListener('onSpeechPartialResults', (event) => {
          const text = event?.value || '';
          callbacks.onResult?.(text, false);
        }),
        DeviceEventEmitter.addListener('onSpeechVolume', (event) => {
          const vol = event?.volume || 0;
          callbacks.onVolume?.(vol);
        }),
        DeviceEventEmitter.addListener('onSpeechEnd', () => {
          callbacks.onEnd?.();
        }),
        DeviceEventEmitter.addListener('onSpeechError', (event) => {
          callbacks.onError?.(event?.errorMessage || 'Recognition error');
        })
      );

      if (NativeVoice && NativeVoice.startListening) {
        await NativeVoice.startListening();
        return true;
      } else {
        callbacks.onError?.('Native voice module not initialized. Please rebuild app.');
        return false;
      }
    } catch (err: any) {
      callbacks.onError?.(err?.message || 'Could not start voice recognition');
      return false;
    }
  }

  static async stopListening(): Promise<void> {
    try {
      if (NativeVoice && NativeVoice.stopListening) {
        await NativeVoice.stopListening();
      }
    } catch (e) {
      // Ignore
    }
  }

  static async cancelListening(): Promise<void> {
    try {
      this.cleanSubscriptions();
      if (NativeVoice && NativeVoice.cancelListening) {
        await NativeVoice.cancelListening();
      }
    } catch (e) {
      // Ignore
    }
  }

  private static cleanSubscriptions(): void {
    this.subscriptions.forEach((sub) => {
      try {
        sub.remove();
      } catch (e) {}
    });
    this.subscriptions = [];
  }
}
