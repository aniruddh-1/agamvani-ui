package in.ramsabha.agamvani;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.ext.mediasession.MediaSessionConnector;

public class AudioPlaybackService extends Service {
    private static final String CHANNEL_ID = "audio_playback_channel";
    private static final int NOTIFICATION_ID = 1001;
    
    private ExoPlayer player;
    private MediaSessionCompat mediaSession;
    private MediaSessionConnector mediaSessionConnector;
    private final IBinder binder = new AudioServiceBinder();
    private String currentTrackTitle = "लाइव स्ट्रीमिंग"; // Default: "Live Streaming" in Hindi
    
    public class AudioServiceBinder extends Binder {
        AudioPlaybackService getService() {
            return AudioPlaybackService.this;
        }
    }
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        // Create notification channel
        createNotificationChannel();
        
        // Initialize ExoPlayer
        player = new ExoPlayer.Builder(this).build();
        
        // Initialize Media Session
        mediaSession = new MediaSessionCompat(this, "AudioPlaybackService");
        mediaSession.setActive(true);
        
        // Connect Media Session to ExoPlayer
        mediaSessionConnector = new MediaSessionConnector(mediaSession);
        mediaSessionConnector.setPlayer(player);
        
        // Add player listener
        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int state) {
                updateNotification();
            }
            
            @Override
            public void onIsPlayingChanged(boolean isPlaying) {
                updateNotification();
            }
        });
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // Start as foreground service immediately
        startForeground(NOTIFICATION_ID, createNotification());
        
        if (intent != null) {
            String action = intent.getAction();
            if (action != null) {
                switch (action) {
                    case "START_AUDIO":
                        String url = intent.getStringExtra("url");
                        String title = intent.getStringExtra("title");
                        if (title != null && !title.isEmpty()) {
                            currentTrackTitle = title;
                        }
                        if (url != null) {
                            playUrl(url);
                        }
                        updateNotification();
                        break;
                    case "PAUSE_AUDIO":
                        player.pause();
                        updateNotification();
                        break;
                    case "RESUME_AUDIO":
                        player.play();
                        updateNotification();
                        break;
                    case "STOP_AUDIO":
                        stopPlayback();
                        break;
                    case "UPDATE_TRACK":
                        String newTitle = intent.getStringExtra("title");
                        if (newTitle != null && !newTitle.isEmpty()) {
                            updateTrackTitle(newTitle);
                        }
                        break;
                }
            }
        }
        
        return START_STICKY;
    }
    
    public void playUrl(String url) {
        MediaItem mediaItem = MediaItem.fromUri(url);
        player.setMediaItem(mediaItem);
        player.prepare();
        player.play();
    }
    
    public void pause() {
        player.pause();
    }
    
    public void resume() {
        player.play();
    }
    
    public void stop() {
        stopPlayback();
    }
    
    public boolean isPlaying() {
        return player.isPlaying();
    }
    
    public void updateTrackTitle(String title) {
        if (title != null && !title.isEmpty()) {
            currentTrackTitle = title;
            updateNotification();
        }
    }
    
    private void stopPlayback() {
        player.stop();
        player.clearMediaItems();
        stopForeground(true);
        stopSelf();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Audio Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Background audio playback");
            channel.setShowBadge(false);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }
    
    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 
            0, 
            notificationIntent, 
            PendingIntent.FLAG_IMMUTABLE
        );
        
        // Create pause/play action
        Intent pauseIntent = new Intent(this, AudioPlaybackService.class);
        pauseIntent.setAction(player.isPlaying() ? "PAUSE" : "PLAY");
        PendingIntent pausePendingIntent = PendingIntent.getService(
            this, 
            0, 
            pauseIntent, 
            PendingIntent.FLAG_IMMUTABLE
        );
        
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("अगम वाणी")
            .setContentText(currentTrackTitle)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setLargeIcon(android.graphics.BitmapFactory.decodeResource(
                getResources(), 
                R.mipmap.ic_launcher
            ))
            .setContentIntent(pendingIntent)
            .addAction(
                player.isPlaying() ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                player.isPlaying() ? "Pause" : "Play",
                pausePendingIntent
            )
            .setOngoing(player.isPlaying())
            .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                .setMediaSession(mediaSession.getSessionToken())
                .setShowActionsInCompactView(0))
            .build();
    }
    
    private void updateNotification() {
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, createNotification());
        }
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }
    
    @Override
    public void onDestroy() {
        mediaSessionConnector.setPlayer(null);
        mediaSession.release();
        player.release();
        super.onDestroy();
    }
}

