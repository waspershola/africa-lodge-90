// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useToast } from '@/hooks/use-toast';

interface AudioPreferences {
  id: string;
  user_id: string;
  tenant_id: string;
  notification_sounds: boolean;
  qr_request_sound: boolean;
  payment_sound: boolean;
  urgent_alert_sound: boolean;
  volume_level: number;
  sound_theme: string;
}

interface AudioNotificationOptions {
  type: 'shift_start' | 'shift_end' | 'handover_required' | 'qr_request' | 'payment' | 'urgent_alert';
  priority?: 'low' | 'medium' | 'high';
  repeat?: number;
}

export const useAudioNotifications = () => {
  const { user, tenant } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user audio preferences
  const { data: audioPrefs } = useQuery({
    queryKey: ['audio-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id || !tenant?.tenant_id) return null;
      
      const { data, error } = await supabase
        .from('audio_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('tenant_id', tenant.tenant_id)
        .maybeSingle();

      if (error) throw error;
      return data as AudioPreferences | null;
    },
    enabled: !!user?.id && !!tenant?.tenant_id,
  });

  // Update audio preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<AudioPreferences>) => {
      if (!user?.id || !tenant?.tenant_id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('audio_preferences')
        .upsert({
          user_id: user.id,
          tenant_id: tenant.tenant_id,
          ...updates
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-preferences'] });
      toast({
        title: "Audio preferences updated",
        description: "Your notification sound settings have been saved.",
      });
    }
  });

  // Play audio notification based on type and preferences
  const playNotification = (options: AudioNotificationOptions) => {
    if (!audioPrefs) return;

    // Check if specific sound type is enabled
    const shouldPlay = () => {
      switch (options.type) {
        case 'shift_start':
        case 'shift_end':
        case 'handover_required':
          return audioPrefs.notification_sounds;
        case 'qr_request':
          return audioPrefs.qr_request_sound;
        case 'payment':
          return audioPrefs.payment_sound;
        case 'urgent_alert':
          return audioPrefs.urgent_alert_sound;
        default:
          return audioPrefs.notification_sounds;
      }
    };

    if (!shouldPlay()) return;

    // Get sound file based on theme and type
    const getSoundFile = () => {
      const theme = audioPrefs.sound_theme || 'default';
      const soundMap = {
        'default': {
          'shift_start': '/sounds/shift-start.mp3',
          'shift_end': '/sounds/shift-end.mp3',
          'handover_required': '/sounds/urgent-alert.mp3',
          'qr_request': '/sounds/qr-request.mp3',
          'payment': '/sounds/payment.mp3',
          'urgent_alert': '/sounds/urgent-alert.mp3'
        },
        'professional': {
          'shift_start': '/sounds/professional/shift-start.mp3',
          'shift_end': '/sounds/professional/shift-end.mp3',
          'handover_required': '/sounds/professional/urgent.mp3',
          'qr_request': '/sounds/professional/notification.mp3',
          'payment': '/sounds/professional/payment.mp3',
          'urgent_alert': '/sounds/professional/urgent.mp3'
        }
      };

      return soundMap[theme as keyof typeof soundMap]?.[options.type] || soundMap.default[options.type];
    };

    try {
      const audio = new Audio(getSoundFile());
      audio.volume = (audioPrefs.volume_level || 70) / 100;
      
      // Handle priority-based repetition
      const playCount = options.priority === 'high' ? (options.repeat || 2) : 1;
      
      let currentPlay = 0;
      const playSound = () => {
        audio.play().catch(console.warn);
        currentPlay++;
        
        if (currentPlay < playCount) {
          setTimeout(playSound, 1500); // 1.5 second gap between repeats
        }
      };
      
      playSound();
    } catch (error) {
      console.warn('Failed to play audio notification:', error);
    }
  };

  // Shift-specific notification methods
  const notifyShiftStart = (staffName: string, role: string) => {
    playNotification({ 
      type: 'shift_start', 
      priority: 'medium' 
    });
    
    // Show visual notification as well
    toast({
      title: "Shift Started",
      description: `${staffName} has started their ${role} shift`,
      duration: 3000,
    });
  };

  const notifyShiftEnd = (staffName: string, role: string, unresolvedCount?: number) => {
    playNotification({ 
      type: 'shift_end', 
      priority: unresolvedCount && unresolvedCount > 0 ? 'high' : 'medium',
      repeat: unresolvedCount && unresolvedCount > 0 ? 2 : 1
    });
    
    toast({
      title: "Shift Ended",
      description: `${staffName} has ended their ${role} shift${unresolvedCount ? ` with ${unresolvedCount} unresolved items` : ''}`,
      duration: 4000,
      variant: unresolvedCount && unresolvedCount > 0 ? 'destructive' : 'default'
    });
  };

  const notifyHandoverRequired = (unresolvedCount: number) => {
    playNotification({ 
      type: 'handover_required', 
      priority: 'high',
      repeat: 3
    });
    
    toast({
      title: "Handover Required",
      description: `${unresolvedCount} unresolved items require immediate handover`,
      duration: 5000,
      variant: 'destructive'
    });
  };

  return {
    audioPrefs,
    updatePreferences,
    playNotification,
    notifyShiftStart,
    notifyShiftEnd,
    notifyHandoverRequired
  };
};