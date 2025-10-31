import { registerPlugin } from '@capacitor/core';

export interface BackgroundAudioPlugin {
  play(options: { url: string }): Promise<{ success: boolean }>;
  pause(): Promise<{ success: boolean }>;
  resume(): Promise<{ success: boolean }>;
  stop(): Promise<{ success: boolean }>;
  isPlaying(): Promise<{ isPlaying: boolean }>;
}

const BackgroundAudio = registerPlugin<BackgroundAudioPlugin>('BackgroundAudio', {
  web: () => import('./backgroundAudioPluginWeb').then(m => new m.BackgroundAudioWeb()),
});

export default BackgroundAudio;

