package in.ramsabha.agamvani;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BackgroundAudio")
public class BackgroundAudioPlugin extends Plugin {
    
    @PluginMethod
    public void startAudio(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title", "Audio Stream");
        
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }
        
        Context context = getContext();
        Intent serviceIntent = new Intent(context, AudioPlaybackService.class);
        serviceIntent.setAction("START_AUDIO");
        serviceIntent.putExtra("url", url);
        serviceIntent.putExtra("title", title);
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void stopAudio(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, AudioPlaybackService.class);
        context.stopService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void pauseAudio(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, AudioPlaybackService.class);
        serviceIntent.setAction("PAUSE_AUDIO");
        context.startService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void resumeAudio(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, AudioPlaybackService.class);
        serviceIntent.setAction("RESUME_AUDIO");
        context.startService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void updateTrackTitle(PluginCall call) {
        String title = call.getString("title");
        
        if (title == null || title.isEmpty()) {
            call.reject("Title is required");
            return;
        }
        
        Context context = getContext();
        Intent serviceIntent = new Intent(context, AudioPlaybackService.class);
        serviceIntent.setAction("UPDATE_TRACK");
        serviceIntent.putExtra("title", title);
        context.startService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void setVolume(PluginCall call) {
        Double volumeDouble = call.getDouble("volume");
        
        if (volumeDouble == null) {
            call.reject("Volume is required");
            return;
        }
        
        float volume = volumeDouble.floatValue();
        
        // Clamp volume between 0 and 1
        if (volume < 0) volume = 0;
        if (volume > 1) volume = 1;
        
        Context context = getContext();
        Intent serviceIntent = new Intent(context, AudioPlaybackService.class);
        serviceIntent.setAction("SET_VOLUME");
        serviceIntent.putExtra("volume", volume);
        context.startService(serviceIntent);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}

