import { WebPlugin } from '@capacitor/core';
import type { BackgroundAudioPlugin } from './backgroundAudioPlugin';

export class BackgroundAudioWeb extends WebPlugin implements BackgroundAudioPlugin {
  async play(options: { url: string }): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.play', options);
    // Browser/web implementation - falls back to HTML5 audio
    return { success: true };
  }

  async pause(): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.pause');
    return { success: true };
  }

  async resume(): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.resume');
    return { success: true };
  }

  async stop(): Promise<{ success: boolean }> {
    console.log('BackgroundAudioWeb.stop');
    return { success: true };
  }

  async isPlaying(): Promise<{ isPlaying: boolean }> {
    console.log('BackgroundAudioWeb.isPlaying');
    return { isPlaying: false };
  }
}

