package com.myapp

import android.content.pm.PackageManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AppConfigModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AppConfig"
    }

    override fun getConstants(): MutableMap<String, Any> {
        val constants = HashMap<String, Any>()
        try {
            val appInfo = reactContext.packageManager.getApplicationInfo(
                reactContext.packageName,
                PackageManager.GET_META_DATA
            )
            val apiKey = appInfo.metaData?.getString("com.groq.api.key") ?: ""
            constants["GROQ_API_KEY"] = apiKey
        } catch (e: Exception) {
            constants["GROQ_API_KEY"] = ""
        }
        return constants
    }

    @ReactMethod
    fun getGroqApiKey(promise: Promise) {
        try {
            val appInfo = reactContext.packageManager.getApplicationInfo(
                reactContext.packageName,
                PackageManager.GET_META_DATA
            )
            val apiKey = appInfo.metaData?.getString("com.groq.api.key") ?: ""
            promise.resolve(apiKey)
        } catch (e: Exception) {
            promise.resolve("")
        }
    }
}
