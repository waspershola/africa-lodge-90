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
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Check if it's a network/connection error
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('connection')) {
          return { 
            success: false, 
            error: 'Network Connection Failed',
            details: 'Unable to reach the invitation service. Please check your internet connection and try again.'
          };
        }
        
        // Return a structured error response with better messaging
        return { 
          success: false, 
          error: 'Service Error',
          details: `Invitation service error: ${error.message || 'Unknown error occurred'}`
        };
      }

      // Handle both success and error responses from the edge function
      if (!response) {
        return {
          success: false,
          error: 'No Response',
          details: 'The server did not return a response. Please try again.'
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
      console.log('Calling reset-user-password function for user:', userId);
      
      const response = await supabase.functions.invoke('reset-user-password', {
        body: { 
          user_id: userId,
          send_email: true
        }
      });

      console.log('Reset password response:', response);

      if (response.error) {
        console.error('Supabase function error:', response.error);
        throw new Error(response.error.message || 'Function call failed');
      }

      const result = response.data;
      
      if (!result) {
        throw new Error('No response data received');
      }
      
      if (result.success) {
        console.log('Password reset successful, temp_password provided:', !!result.temp_password);
        return {
          success: true,
          temp_password: result.temp_password
        };
      } else {
        console.error('Password reset failed:', result.error);
        return {
          success: false,
          error: result.error || 'Failed to reset password'
        };
      }
      
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset password'
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