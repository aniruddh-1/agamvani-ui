package in.ramsabha.agamvani;

import android.os.Bundle;
import android.content.pm.ApplicationInfo;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Local plugins must be registered before super.onCreate(), which builds the
        // bridge; plugins registered afterwards are never exposed to JS.
        registerPlugin(BackgroundAudioPlugin.class);

        super.onCreate(savedInstanceState);

        // Never expose WebView internals in release builds.
        boolean debuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        WebView.setWebContentsDebuggingEnabled(debuggable);

        // Enable media playback in background
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings webSettings = this.bridge.getWebView().getSettings();
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            webSettings.setDomStorageEnabled(true);
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Don't pause WebView when app goes to background
        // This allows audio to continue playing
    }

    @Override
    public void onResume() {
        super.onResume();
        // Resume WebView when app comes to foreground
    }
}
