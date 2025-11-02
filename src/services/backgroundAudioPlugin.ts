import { registerPlugin } from '@capacitor/core';

export interface BackgroundAudioPlugin {
  startAudio(options: { url: string; title?: string }): Promise<{ success: boolean }>;
  stopAudio(): Promise<{ success: boolean }>;
  pauseAudio(): Promise<{ success: boolean }>;
  resumeAudio(): Promise<{ success: boolean }>;
  updateTrackTitle(options: { title: string }): Promise<{ success: boolean }>;
  setVolume(options: { volume: number }): Promise<{ success: boolean }>;
}

const BackgroundAudio = registerPlugin<BackgroundAudioPlugin>('BackgroundAudio', {
  web: () => import('./backgroundAudioPluginWeb').then(m => new m.BackgroundAudioWeb()),
});

export default BackgroundAudio;

