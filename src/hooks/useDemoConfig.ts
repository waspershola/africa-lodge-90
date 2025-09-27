import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DemoConfig {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url?: string;
  cta_text: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UseDemoConfigReturn {
  config: DemoConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (updates: Partial<DemoConfig>) => Promise<void>;
}

export const useDemoConfig = (): UseDemoConfigReturn => {
  const [config, setConfig] = useState<DemoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch from Supabase demo_config table
      const { data, error: supabaseError } = await supabase
        .from('demo_config')
        .select('*')
        .eq('enabled', true)
        .single();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      setConfig(data);
    } catch (err) {
      setError('Failed to load demo configuration');
      console.error('Error loading demo config:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshConfig = async () => {
    await loadConfig();
  };

  const updateConfig = async (updates: Partial<DemoConfig>) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!config) {
        throw new Error('No config loaded to update');
      }
      
      // Update in Supabase demo_config table
      const { data, error: supabaseError } = await supabase
        .from('demo_config')
        .update(updates)
        .eq('id', config.id)
        .select()
        .single();
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      setConfig(data);
    } catch (err) {
      setError('Failed to update demo configuration');
      console.error('Error updating demo config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refreshConfig,
    updateConfig
  };
};