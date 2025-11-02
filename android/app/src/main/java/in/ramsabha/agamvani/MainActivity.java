package in.ramsabha.agamvani;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom plugins
        registerPlugin(BackgroundAudioPlugin.class);
        
        // Keep screen on for audio playback (optional - can be controlled from JS)
        // getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        
        // Enable media playback in background
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebSettings webSettings = this.bridge.getWebView().getSettings();
            webSettings.setMediaPlaybackRequiresUserGesture(false);
            
            // Enable DOM storage for better performance
            // Note: AppCache is deprecated in API 33+ and no longer needed
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
