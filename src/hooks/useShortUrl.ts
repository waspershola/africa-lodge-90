import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreateShortUrlParams {
  url: string;
  tenantId: string;
  sessionToken?: string;
  linkType?: 'qr_redirect' | 'session_resume' | 'menu_link';
}

interface ShortUrlResponse {
  short_url: string;
  short_code: string;
}

export function useShortUrl() {
  const createShortUrl = useMutation({
    mutationFn: async ({ 
      url, 
      tenantId, 
      sessionToken, 
      linkType = 'qr_redirect' 
    }: CreateShortUrlParams): Promise<ShortUrlResponse> => {
      const { data, error } = await supabase.functions.invoke('url-shortener', {
        body: { 
          url, 
          tenantId, 
          sessionToken, 
          linkType 
        },
        method: 'POST',
      });

      if (error) throw error;
      return data as ShortUrlResponse;
    },
  });

  return {
    createShortUrl: createShortUrl.mutateAsync,
    isLoading: createShortUrl.isPending,
    error: createShortUrl.error,
  };
}
