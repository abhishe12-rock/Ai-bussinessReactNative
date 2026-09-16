package com.myapp

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

class VoiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), TextToSpeech.OnInitListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsInitialized = false
    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        mainHandler.post {
            try {
                textToSpeech = TextToSpeech(reactContext.applicationContext, this)
            } catch (e: Exception) {
                // Ignore initialization error
            }
        }
    }

    override fun getName(): String = "NativeVoice"

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            textToSpeech?.let { tts ->
                tts.language = Locale.getDefault()
                isTtsInitialized = true
                tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        val params = Arguments.createMap().apply {
                            putString("utteranceId", utteranceId)
                        }
                        sendEvent("onTtsStart", params)
                    }

                    override fun onDone(utteranceId: String?) {
                        val params = Arguments.createMap().apply {
                            putString("utteranceId", utteranceId)
                        }
                        sendEvent("onTtsDone", params)
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        val params = Arguments.createMap().apply {
                            putString("utteranceId", utteranceId)
                        }
                        sendEvent("onTtsError", params)
                    }
                })
            }
        }
    }

    // ----------------------------------------------------
    // TEXT TO SPEECH (TTS)
    // ----------------------------------------------------
    @ReactMethod
    fun speak(text: String, utteranceId: String, promise: Promise) {
        mainHandler.post {
            try {
                if (textToSpeech == null || !isTtsInitialized) {
                    textToSpeech = TextToSpeech(reactContext.applicationContext) { status ->
                        if (status == TextToSpeech.SUCCESS) {
                            isTtsInitialized = true
                            textToSpeech?.language = Locale.getDefault()
                            textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
                            promise.resolve(true)
                        } else {
                            promise.reject("TTS_ERROR", "Text to speech initialization failed")
                        }
                    }
                } else {
                    textToSpeech?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
                    promise.resolve(true)
                }
            } catch (e: Exception) {
                promise.reject("TTS_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun stopSpeaking(promise: Promise) {
        mainHandler.post {
            try {
                textToSpeech?.stop()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    // ----------------------------------------------------
    // SPEECH TO TEXT (STT)
    // ----------------------------------------------------
    @ReactMethod
    fun startListening(promise: Promise) {
        mainHandler.post {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
                    promise.reject("STT_UNAVAILABLE", "Speech recognition is not available on this device")
                    return@post
                }

                speechRecognizer?.destroy()
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)

                speechRecognizer?.setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        sendEvent("onSpeechStart", null)
                    }

                    override fun onBeginningOfSpeech() {}

                    override fun onRmsChanged(rmsdB: Float) {
                        val params = Arguments.createMap().apply {
                            putDouble("volume", rmsdB.toDouble())
                        }
                        sendEvent("onSpeechVolume", params)
                    }

                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        sendEvent("onSpeechEnd", null)
                    }

                    override fun onError(error: Int) {
                        val params = Arguments.createMap().apply {
                            putInt("error", error)
                            putString("errorMessage", getErrorMessage(error))
                        }
                        sendEvent("onSpeechError", params)
                    }

                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val params = Arguments.createMap().apply {
                            val text = matches?.firstOrNull() ?: ""
                            putString("value", text)
                            putBoolean("isFinal", true)
                        }
                        sendEvent("onSpeechResults", params)
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val params = Arguments.createMap().apply {
                            val text = matches?.firstOrNull() ?: ""
                            putString("value", text)
                            putBoolean("isFinal", false)
                        }
                        sendEvent("onSpeechPartialResults", params)
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
                }

                speechRecognizer?.startListening(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("STT_ERROR", e.message)
            }
        }
    }

    @ReactMethod
    fun stopListening(promise: Promise) {
        mainHandler.post {
            try {
                speechRecognizer?.stopListening()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun cancelListening(promise: Promise) {
        mainHandler.post {
            try {
                speechRecognizer?.cancel()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    private fun getErrorMessage(errorCode: Int): String {
        return when (errorCode) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized. Please try again."
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service busy"
            SpeechRecognizer.ERROR_SERVER -> "Server error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input detected"
            else -> "Speech recognition error"
        }
    }

    private fun sendEvent(eventName: String, params: Any?) {
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            // Context might not be ready yet
        }
    }

    override fun invalidate() {
        super.invalidate()
        mainHandler.post {
            try {
                speechRecognizer?.destroy()
                speechRecognizer = null
                textToSpeech?.stop()
                textToSpeech?.shutdown()
                textToSpeech = null
            } catch (e: Exception) {
                // Ignore
            }
        }
    }
}
