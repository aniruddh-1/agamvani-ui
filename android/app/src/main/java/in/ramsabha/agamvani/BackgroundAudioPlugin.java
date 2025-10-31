package in.ramsabha.agamvani;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "BackgroundAudio")
public class BackgroundAudioPlugin extends Plugin {
    
    private AudioPlaybackService audioService;
    private boolean serviceBound = false;
    
    private ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName name, IBinder service) {
            AudioPlaybackService.AudioServiceBinder binder = (AudioPlaybackService.AudioServiceBinder) service;
            audioService = binder.getService();
            serviceBound = true;
        }
        
        @Override
        public void onServiceDisconnected(ComponentName name) {
            serviceBound = false;
            audioService = null;
        }
    };
    
    @Override
    public void load() {
        super.load();
        // Bind to service
        Intent intent = new Intent(getContext(), AudioPlaybackService.class);
        getContext().bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE);
    }
    
    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        
        if (url == null || url.isEmpty()) {
            call.reject("URL is required");
            return;
        }
        
        Context context = getContext();
        Intent intent = new Intent(context, AudioPlaybackService.class);
        intent.setAction("PLAY");
        intent.putExtra("url", url);
        context.startForegroundService(intent);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void pause(PluginCall call) {
        if (serviceBound && audioService != null) {
            audioService.pause();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("Service not bound");
        }
    }
    
    @PluginMethod
    public void resume(PluginCall call) {
        if (serviceBound && audioService != null) {
            audioService.resume();
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("Service not bound");
        }
    }
    
    @PluginMethod
    public void stop(PluginCall call) {
        Context context = getContext();
        Intent intent = new Intent(context, AudioPlaybackService.class);
        intent.setAction("STOP");
        context.startService(intent);
        
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
    
    @PluginMethod
    public void isPlaying(PluginCall call) {
        if (serviceBound && audioService != null) {
            JSObject ret = new JSObject();
            ret.put("isPlaying", audioService.isPlaying());
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("isPlaying", false);
            call.resolve(ret);
        }
    }
    
    @Override
    protected void handleOnDestroy() {
        if (serviceBound) {
            getContext().unbindService(serviceConnection);
            serviceBound = false;
        }
        super.handleOnDestroy();
    }
}

