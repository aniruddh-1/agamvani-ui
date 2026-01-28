package in.ramsabha.agamvani;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable WebView debugging for Chrome DevTools (chrome://inspect)
        WebView.setWebContentsDebuggingEnabled(true);

        // Register custom plugins
        registerPlugin(BackgroundAudioPlugin.class);

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
