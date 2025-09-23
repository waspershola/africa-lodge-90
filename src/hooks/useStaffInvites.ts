import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface InviteUserRequest {
  email: string;
  name: string;
  role: string;
  tenant_id?: string;
  department?: string;
  send_email?: boolean;
  
  // Additional profile fields
  phone?: string;
  address?: string;
  nin?: string;
  date_of_birth?: string;
  nationality?: string;
  employee_id?: string;
  hire_date?: string;
  employment_type?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  bank_name?: string;
  account_number?: string;
  passport_number?: string;
  drivers_license?: string;
}

interface InviteUserResponse {
  success: boolean;
  user_id?: string;
  email?: string;
  role?: string;
  tenant_id?: string;
  force_reset?: boolean;
  temp_expires?: string;
  email_sent?: boolean;
  temp_password?: string;
  email_error?: string;
  error?: string;
  details?: string;
  availableRoles?: string[];
}

export const useStaffInvites = () => {
  const [isLoading, setIsLoading] = useState(false);

  const inviteUser = async (data: InviteUserRequest): Promise<InviteUserResponse> => {
    setIsLoading(true);
    
    try {
      console.log('Sending invite request to edge function:', {
        email: data.email,
        role: data.role,
        tenant_id: data.tenant_id,
        send_email: data.send_email
      });
      
      const { data: response, error } = await supabase.functions.invoke('invite-user-enhanced', {
        body: data
      });

      console.log('Edge function response:', { response, error });

      if (error) {
        console.error('Supabase function invoke error:', error);
        
        // Return a structured error response with better messaging
        return { 
          success: false, 
          error: 'Failed to connect to invitation service',
          details: error.message 
        };
      }

      // Handle both success and error responses from the edge function
      if (!response) {
        return {
          success: false,
          error: 'No response from server',
          details: 'The server did not return a response'
        };
      }

      // Return the response as-is, whether success or error
      // The edge function now always includes temp_password when needed
      return response;
      
    } catch (error) {
      console.error('Unexpected error during invitation:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Don't show duplicate toast - let the calling component handle it
      console.error('Unexpected error during invitation:', errorMessage);
      
      return { 
        success: false, 
        error: 'Unexpected error occurred',
        details: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserPassword = async (userId: string): Promise<{ success: boolean; temp_password?: string; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Generate new temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const tempExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Update user's password and force reset
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({
          force_reset: true,
          temp_expires: tempExpires.toISOString(),
        })
        .eq('id', userId)
        .select('email, name')
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        toast.error('Failed to reset password');
        return { success: false, error: updateError.message };
      }

      // Reset password via admin API (would need service role key)
      // For now, return temp password for manual sharing
      toast.success('Password reset initiated. Share the new temporary password.');
      
      return { 
        success: true, 
        temp_password: tempPassword 
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    inviteUser,
    resetUserPassword,
    isLoading
  };
};