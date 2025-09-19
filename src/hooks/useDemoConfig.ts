import { useState, useEffect } from 'react';

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

// Mock demo configuration
const mockConfig: DemoConfig = {
  id: 'demo-config-1',
  title: 'See LuxuryHotelSaaS in Action',
  description: 'Watch how hotels worldwide are transforming their operations with our comprehensive management platform.',
  video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Demo video URL
  thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  cta_text: 'Watch Full Demo',
  enabled: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const useDemoConfig = (): UseDemoConfigReturn => {
  const [config, setConfig] = useState<DemoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // In production, this will be:
      // const response = await fetch('/api/demo-config');
      // const data = await response.json();
      
      setConfig(mockConfig);
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
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In production, this will be:
      // const response = await fetch('/api/demo-config', {
      //   method: 'PATCH',
      //   body: JSON.stringify(updates)
      // });
      
      if (config) {
        setConfig({ ...config, ...updates });
      }
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