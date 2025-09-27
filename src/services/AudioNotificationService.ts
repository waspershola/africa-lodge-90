/**
 * AudioNotificationService - Handles sound alerts and notifications for front desk operations
 * 
 * Features:
 * - Different sound types for QR requests, payments, maintenance, etc.
 * - Volume control and user preferences
 * - Desktop notifications with sound
 * - Queue management to prevent audio spam
 */

export type NotificationType = 'qr_request' | 'urgent' | 'payment' | 'maintenance' | 'general';

export interface AudioPreferences {
  qr_request: { enabled: boolean; sound: string; volume: number };
  urgent: { enabled: boolean; sound: string; volume: number };
  payment: { enabled: boolean; sound: string; volume: number };
  maintenance: { enabled: boolean; sound: string; volume: number };
  general: { enabled: boolean; sound: string; volume: number };
}

export interface NotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  autoHide?: number; // milliseconds
  data?: any;
}

class AudioNotificationService {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private preferences: AudioPreferences = {
    qr_request: { enabled: true, sound: 'chime', volume: 0.8 },
    urgent: { enabled: true, sound: 'siren', volume: 1.0 },
    payment: { enabled: true, sound: 'cash', volume: 0.6 },
    maintenance: { enabled: true, sound: 'alert', volume: 0.7 },
    general: { enabled: true, sound: 'beep', volume: 0.5 }
  };
  private isInitialized = false;
  private notificationQueue: NotificationOptions[] = [];
  private isPlaying = false;
  private listeners: Map<string, Function[]> = new Map();

  // Sound files mapping
  private soundFiles = {
    chime: '/sounds/chime.mp3',
    siren: '/sounds/siren.mp3',
    cash: '/sounds/cash.mp3',
    alert: '/sounds/alert.mp3',
    beep: '/sounds/beep.mp3',
    success: '/sounds/success.mp3',
    error: '/sounds/error.mp3'
  };

  constructor() {
    this.initializeAudioContext();
    this.loadSoundPreferences();
    this.requestNotificationPermission();
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context on user interaction if suspended
      if (this.audioContext.state === 'suspended') {
        const resumeAudio = () => {
          if (this.audioContext) {
            this.audioContext.resume();
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
          }
        };
        document.addEventListener('click', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
      }

      await this.loadSoundFiles();
      this.isInitialized = true;
      console.log('AudioNotificationService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioNotificationService:', error);
    }
  }

  private async loadSoundFiles() {
    const loadPromises = Object.entries(this.soundFiles).map(async ([name, path]) => {
      try {
        // For development, we'll create synthetic sounds
        const buffer = this.createSyntheticSound(name);
        this.audioBuffers.set(name, buffer);
      } catch (error) {
        console.warn(`Failed to load sound file ${name}:`, error);
      }
    });

    await Promise.all(loadPromises);
    console.log(`Loaded ${this.audioBuffers.size} sound files`);
  }

  private createSyntheticSound(soundType: string): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const duration = soundType === 'siren' ? 2 : 1; // seconds
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const channelData = buffer.getChannelData(0);

    // Generate different synthetic sounds based on type
    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      
      switch (soundType) {
        case 'chime':
          channelData[i] = Math.sin(2 * Math.PI * 800 * t) * Math.exp(-t * 3) * 0.3;
          break;
        case 'siren':
          const freq = 400 + 200 * Math.sin(2 * Math.PI * 2 * t);
          channelData[i] = Math.sin(2 * Math.PI * freq * t) * 0.5;
          break;
        case 'cash':
          channelData[i] = (Math.random() - 0.5) * Math.exp(-t * 5) * 0.3;
          break;
        case 'alert':
          channelData[i] = Math.sin(2 * Math.PI * 1000 * t) * Math.exp(-t * 2) * 0.4;
          break;
        case 'success':
          channelData[i] = Math.sin(2 * Math.PI * 600 * t) * Math.exp(-t * 2) * 0.3;
          break;
        case 'error':
          channelData[i] = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t * 1) * 0.4;
          break;
        default: // beep
          channelData[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 4) * 0.2;
      }
    }

    return buffer;
  }

  private async requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  private loadSoundPreferences() {
    const stored = localStorage.getItem('audio-notification-preferences');
    if (stored) {
      try {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      } catch (error) {
        console.warn('Failed to load audio preferences:', error);
      }
    }
  }

  public updatePreferences(newPreferences: Partial<AudioPreferences>) {
    this.preferences = { ...this.preferences, ...newPreferences };
    localStorage.setItem('audio-notification-preferences', JSON.stringify(this.preferences));
  }

  public getPreferences(): AudioPreferences {
    return { ...this.preferences };
  }

  private async playSound(soundType: string, volume: number = 0.5) {
    if (!this.isInitialized || !this.audioContext) return;

    const buffer = this.audioBuffers.get(soundType);
    if (!buffer) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = buffer;
      gainNode.gain.value = Math.max(0, Math.min(1, volume));

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }

  private showDesktopNotification(options: NotificationOptions) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const notification = new Notification(options.title, {
      body: options.message,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `notification-${options.type}`,
      requireInteraction: options.priority === 'urgent',
      data: options.data
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      this.emit('notificationClick', options);
    };

    if (options.autoHide && options.autoHide > 0) {
      setTimeout(() => notification.close(), options.autoHide);
    }
  }

  public async notify(options: NotificationOptions) {
    if (!this.isInitialized) {
      this.notificationQueue.push(options);
      return;
    }

    const prefs = this.preferences[options.type];
    if (!prefs?.enabled) return;

    // Play sound
    if (prefs.sound) {
      await this.playSound(prefs.sound, prefs.volume);
    }

    // Show desktop notification
    this.showDesktopNotification(options);

    // Emit event for UI updates
    this.emit('notification', options);
  }

  // Quick notification methods
  public async notifyQRRequest(message: string, data?: any) {
    await this.notify({
      type: 'qr_request',
      title: 'New QR Request',
      message,
      priority: 'high',
      autoHide: 10000,
      data
    });
  }

  public async notifyUrgent(message: string, data?: any) {
    await this.notify({
      type: 'urgent',
      title: '🚨 URGENT ALERT',
      message,
      priority: 'urgent',
      data
    });
  }

  public async notifyPayment(message: string, data?: any) {
    await this.notify({
      type: 'payment',
      title: 'Payment Received',
      message,
      priority: 'medium',
      autoHide: 5000,
      data
    });
  }

  public async notifyMaintenance(message: string, data?: any) {
    await this.notify({
      type: 'maintenance',
      title: 'Maintenance Alert',
      message,
      priority: 'medium',
      autoHide: 8000,
      data
    });
  }

  public async testSound(type: NotificationType) {
    const prefs = this.preferences[type];
    if (prefs?.sound) {
      await this.playSound(prefs.sound, prefs.volume);
    }
  }

  // Event system
  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // Process queued notifications when initialized
  private async processQueue() {
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      if (notification) {
        await this.notify(notification);
      }
    }
  }

  public setMasterVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    Object.keys(this.preferences).forEach(key => {
      const notifKey = key as NotificationType;
      this.preferences[notifKey].volume = this.preferences[notifKey].volume * clampedVolume;
    });
    this.updatePreferences(this.preferences);
  }

  public async initialize() {
    if (this.isInitialized) return;
    
    await this.initializeAudioContext();
    await this.processQueue();
  }
}

// Export singleton instance
export const audioNotificationService = new AudioNotificationService();
export default audioNotificationService;