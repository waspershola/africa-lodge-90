import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmailSettings {
  from_name: string;
  from_email: string;
  reply_to_email: string;
  smtp_enabled: boolean;
  smtp_config: Record<string, any>;
  email_templates: Record<string, any>;
  branding: Record<string, any>;
  send_to_individuals: boolean;
}

// Hook to fetch hotel email settings
export const useEmailSettings = () => {
  return useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hotel_settings')
        .select('email_settings')
        .eq('tenant_id', user.user_metadata?.tenant_id)
        .maybeSingle();

      if (error) throw error;
      return (data?.email_settings as any) || null;
    }
  });
};

// Hook to update email settings
export const useUpdateEmailSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (emailSettings: EmailSettings) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('hotel_settings')
        .update({ 
          email_settings: emailSettings as any,
          updated_at: new Date().toISOString()
        })
        .eq('tenant_id', user.user_metadata?.tenant_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
      queryClient.invalidateQueries({ queryKey: ['hotel-settings'] });
      toast({
        title: "Success",
        description: "Email settings updated successfully"
      });
    },
    onError: (error) => {
      console.error('Email settings update error:', error);
      toast({
        title: "Error",
        description: "Failed to update email settings",
        variant: "destructive"
      });
    }
  });
};

// Hook to send test email
export const useSendTestEmail = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email, type }: { email: string; type: string }) => {
      const { data, error } = await supabase.functions.invoke('send-reservation-email', {
        body: { 
          testEmail: email, 
          type: 'test',
          templateType: type,
          hotelName: 'banky hotel' // Add hotel name for test
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Test Email Sent",
        description: `Test email sent to ${variables.email}`
      });
    },
    onError: (error) => {
      console.error('Test email error:', error);
      toast({
        title: "Error",
        description: `Failed to send test email: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};