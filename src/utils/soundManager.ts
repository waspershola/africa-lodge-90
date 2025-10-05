/**
 * Sound Manager for Hotel Notification System
 * 
 * Manages audio playback for different notification types with:
 * - Multiple sound types (high, medium, critical)
 * - Volume control
 * - Mute functionality
 * - Quiet hours support
 */

export type SoundType = 'alert-high' | 'alert-medium' | 'alert-critical' | 'none';

interface SoundConfig {
  url: string;
  defaultVolume: number;
  description: string;
}

// Sound configurations for different alert types
const SOUND_CONFIGS: Record<SoundType, SoundConfig | null> = {
  'alert-high': {
    url: '/sounds/alert-high.mp3', // 2-3 second digital bell
    defaultVolume: 0.8,
    description: 'Urgent tasks (Guest requests, payments, new order)'
  },
  'alert-medium': {
    url: '/sounds/alert-medium.mp3', // 1.5 second soft chime
    defaultVolume: 0.5,
    description: 'Informational (Check-in/out, housekeeping update)'
  },
  'alert-critical': {
    url: '/sounds/alert-critical.mp3', // Long buzzer
    defaultVolume: 1.0,
    description: 'Emergency or Escalation (maintenance, fire alarm)'
  },
  'none': null
};

class SoundManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<SoundType, AudioBuffer> = new Map();
  private volume: number = 0.7;
  private isMuted: boolean = false;
  private isQuietHours: boolean = false;

  constructor() {
    // Initialize Audio Context on user interaction
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => this.initAudioContext(), { once: true });
    }
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('[SoundManager] Audio context initialized');
    }
  }

  /**
   * Preload a sound file
   */
  async preloadSound(type: SoundType): Promise<void> {
    if (type === 'none' || this.sounds.has(type)) return;

    const config = SOUND_CONFIGS[type];
    if (!config) return;

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      const response = await fetch(config.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      this.sounds.set(type, audioBuffer);
      console.log(`[SoundManager] Preloaded sound: ${type}`);
    } catch (error) {
      console.warn(`[SoundManager] Failed to preload sound ${type}:`, error);
    }
  }

  /**
   * Play a notification sound
   */
  async play(type: SoundType, customVolume?: number): Promise<void> {
    if (type === 'none' || this.isMuted || this.isQuietHours) {
      console.log(`[SoundManager] Sound suppressed (type: ${type}, muted: ${this.isMuted}, quiet: ${this.isQuietHours})`);
      return;
    }

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      // Preload if not already loaded
      if (!this.sounds.has(type)) {
        await this.preloadSound(type);
      }

      const audioBuffer = this.sounds.get(type);
      if (!audioBuffer) {
        console.warn(`[SoundManager] Sound buffer not found for ${type}`);
        return;
      }

      // Create and configure audio source
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain();
      const config = SOUND_CONFIGS[type];
      const volume = customVolume ?? (config?.defaultVolume || 0.5);
      gainNode.gain.value = volume * this.volume;

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Play sound
      source.start(0);
      console.log(`[SoundManager] Playing ${type} at volume ${gainNode.gain.value}`);

      // Add vibration for mobile (if critical)
      if (type === 'alert-critical' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

    } catch (error) {
      console.error(`[SoundManager] Error playing sound ${type}:`, error);
    }
  }

  /**
   * Set global volume (0-1)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`[SoundManager] Volume set to ${this.volume}`);
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    console.log(`[SoundManager] Muted: ${this.isMuted}`);
    return this.isMuted;
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean) {
    this.isMuted = muted;
    console.log(`[SoundManager] Muted: ${this.isMuted}`);
  }

  /**
   * Set quiet hours mode
   */
  setQuietHours(enabled: boolean) {
    this.isQuietHours = enabled;
    console.log(`[SoundManager] Quiet hours: ${this.isQuietHours}`);
  }

  /**
   * Get current settings
   */
  getSettings() {
    return {
      volume: this.volume,
      isMuted: this.isMuted,
      isQuietHours: this.isQuietHours
    };
  }

  /**
   * Preload all sounds
   */
  async preloadAll(): Promise<void> {
    const types: SoundType[] = ['alert-high', 'alert-medium', 'alert-critical'];
    await Promise.all(types.map(type => this.preloadSound(type)));
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Export helper function for easy use
export function playNotificationSound(type: SoundType, volume?: number) {
  return soundManager.play(type, volume);
}
