# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Preserve line number information for debugging stack traces
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ============================================
# Capacitor Core & Plugins
# ============================================
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.** { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.CapacitorPlugin <methods>;
}
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public <methods>;
}

# ============================================
# Background Audio Playback Support
# ============================================
# Keep MainActivity and all its methods for background audio
-keep class in.ramsabha.agamvani.MainActivity { *; }
-keepclassmembers class in.ramsabha.agamvani.MainActivity {
    public <methods>;
    protected <methods>;
}

# Keep WebView and WebSettings for media playback
-keep class android.webkit.WebView { *; }
-keep class android.webkit.WebSettings { *; }
-keep class android.webkit.WebViewClient { *; }
-keep class android.webkit.WebChromeClient { *; }
-keepclassmembers class android.webkit.WebView {
    public *;
}

# Keep media session and playback classes
-keep class android.media.** { *; }
-keep class android.media.session.** { *; }

# ============================================
# JavaScript Interface for WebView
# ============================================
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keep public class * implements android.webkit.JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface public *;
}

# ============================================
# Google OAuth
# ============================================
-keep class com.codetrixstudio.capacitor.GoogleAuth.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# ============================================
# Capacitor App Plugin (for back button)
# ============================================
-keep class com.capacitorjs.plugins.app.** { *; }

# ============================================
# AndroidX and Support Libraries
# ============================================
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# ============================================
# Serialization
# ============================================
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}
