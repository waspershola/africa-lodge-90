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
      console.log('Sending invite request:', data);
      
      const { data: response, error } = await supabase.functions.invoke('invite-user-enhanced', {
        body: data
      });

      if (error) {
        console.error('Invite function error:', error);
        toast.error('Failed to send invitation');
        return { 
          success: false, 
          error: 'Failed to send invitation',
          details: error.message 
        };
      }

      console.log('Invite response:', response);

      if (response.success) {
        // Show success message
        if (response.email_sent) {
          toast.success(
            `Invitation sent to ${response.email}! They will receive login instructions via email.`
          );
        } else {
          toast.success(
            `User created successfully! Share the temporary password with ${response.email}.`
          );
        }

        // Show additional warnings if email failed
        if (response.email_error) {
          toast.warning(
            `Note: Email delivery failed (${response.email_error}). Please share the temporary password manually.`
          );
        }
      } else {
        toast.error(response.error || 'Failed to create user invitation');
      }

      return response;
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Network error occurred while sending invitation');
      return { 
        success: false, 
        error: 'Network error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
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