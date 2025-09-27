import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface AudioNotificationSettings {
  masterVolume: number;
  qrRequestSound: boolean;
  paymentSound: boolean;
  urgentAlertSound: boolean;
  notificationSounds: boolean;
}

class AudioNotificationService {
  private settings: AudioNotificationSettings;
  private audioContext: AudioContext | null = null;
  
  constructor() {
    this.settings = this.loadSettings();
    this.initializeAudioContext();
  }

  private loadSettings(): AudioNotificationSettings {
    const stored = localStorage.getItem('audio-notification-settings');
    return stored ? JSON.parse(stored) : {
      masterVolume: 70,
      qrRequestSound: true,
      paymentSound: true,
      urgentAlertSound: true,
      notificationSounds: true
    };
  }

  private saveSettings() {
    localStorage.setItem('audio-notification-settings', JSON.stringify(this.settings));
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  private async playTone(frequency: number, duration: number, volume = 0.3) {
    if (!this.audioContext || !this.settings.notificationSounds) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';
      
      const adjustedVolume = (volume * this.settings.masterVolume) / 100;
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(adjustedVolume, this.audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play audio:', error);
    }
  }

  public async playQRRequestSound() {
    if (!this.settings.qrRequestSound) return;
    
    // Pleasant notification sound - ascending tones
    await this.playTone(800, 0.15);
    setTimeout(() => this.playTone(1000, 0.15), 150);
  }

  public async playPaymentSound() {
    if (!this.settings.paymentSound) return;
    
    // Success sound - cheerful ascending pattern
    await this.playTone(600, 0.1);
    setTimeout(() => this.playTone(800, 0.1), 100);
    setTimeout(() => this.playTone(1000, 0.2), 200);
  }

  public async playUrgentAlertSound() {
    if (!this.settings.urgentAlertSound) return;
    
    // Urgent alert - alternating high tones
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(1200, 0.2, 0.5);
        setTimeout(() => this.playTone(900, 0.2, 0.5), 200);
      }, i * 400);
    }
  }

  public updateSettings(newSettings: Partial<AudioNotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  public getSettings(): AudioNotificationSettings {
    return { ...this.settings };
  }

  public async testSound(type: 'qr' | 'payment' | 'urgent') {
    switch (type) {
      case 'qr':
        await this.playQRRequestSound();
        break;
      case 'payment':
        await this.playPaymentSound();
        break;
      case 'urgent':
        await this.playUrgentAlertSound();
        break;
    }
  }
}

export const audioNotificationService = new AudioNotificationService();

export const useAudioNotifications = () => {
  const [settings, setSettings] = useState<AudioNotificationSettings>(
    audioNotificationService.getSettings()
  );

  const updateSettings = useCallback((newSettings: Partial<AudioNotificationSettings>) => {
    audioNotificationService.updateSettings(newSettings);
    setSettings(audioNotificationService.getSettings());
  }, []);

  const testSound = useCallback(async (type: 'qr' | 'payment' | 'urgent') => {
    await audioNotificationService.testSound(type);
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} sound played`);
  }, []);

  return {
    settings,
    updateSettings,
    testSound,
    playQRRequestSound: audioNotificationService.playQRRequestSound.bind(audioNotificationService),
    playPaymentSound: audioNotificationService.playPaymentSound.bind(audioNotificationService),
    playUrgentAlertSound: audioNotificationService.playUrgentAlertSound.bind(audioNotificationService)
  };
};