import { WebPlugin } from '@capacitor/core';
import type { BackgroundAudioPlugin } from './backgroundAudioPlugin';

export class BackgroundAudioWeb extends WebPlugin implements BackgroundAudioPlugin {
  async startAudio(options: { url: string; title?: string }): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.startAudio', options);
    // Browser/web implementation - falls back to HTML5 audio in RadioPlayer
    return { success: true };
  }

  async stopAudio(): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.stopAudio');
    return { success: true };
  }

  async pauseAudio(): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.pauseAudio');
    return { success: true };
  }

  async resumeAudio(): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.resumeAudio');
    return { success: true };
  }
  
  async updateTrackTitle(options: { title: string }): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.updateTrackTitle', options.title);
    return { success: true };
  }
}

