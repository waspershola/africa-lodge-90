import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useManageSystemOwners = () => {
  return useMutation({
    mutationFn: async () => {
      console.log('Managing system owners...');
      
      const { data, error } = await supabase.functions.invoke('manage-system-owners', {
        body: {
          action: 'update_system_owners',
          approved_emails: [
            'wasperstore@gmail.com',
            'info@waspersolution.com', 
            'sholawasiu@gmail.com'
          ],
          delete_emails: [
            'ceo@waspersolution.com',
            'waspershola@gmail.com'
          ]
        }
      });

      if (error) {
        console.error('System owner management error:', error);
        throw new Error(`Network error: ${error.message}`);
      }

      if (data?.success === false) {
        throw new Error(data.error || 'Failed to manage system owners');
      }

      console.log('System owners managed successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      toast.success('System owners updated successfully');
      console.log('Management results:', data.results);
    },
    onError: (error: any) => {
      console.error('Failed to manage system owners:', error);
      toast.error(error.message || 'Failed to manage system owners');
    },
  });
};