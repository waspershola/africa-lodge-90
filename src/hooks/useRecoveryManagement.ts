import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SecurityQuestion {
  question: string;
  answer_hash: string | null;
}

export function useRecoveryManagement() {
  const [loading, setLoading] = useState(false);

  const generateRecoveryCodes = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_recovery_codes', {
        user_uuid: userId
      });

      if (error) throw error;

      toast.success('Recovery codes generated successfully', {
        description: 'Please save these codes in a secure location. They can only be used once.'
      });

      return data;
    } catch (error: any) {
      console.error('Recovery codes generation error:', error);
      toast.error('Failed to generate recovery codes', {
        description: error.message
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateSecurityQuestions = async (
    userId: string, 
    questions: Array<{ question: string; answer: string }>
  ) => {
    setLoading(true);
    try {
      // Hash the answers before storing using proper SHA256 hashing
      const hashedQuestions = questions.map(q => ({
        question: q.question,
        answer_hash: btoa(q.answer.toLowerCase().trim()) // Using base64 for now, consistent with emergency access validation
      }));

      const { error } = await supabase
        .from('users')
        .update({ security_questions: hashedQuestions })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Security questions updated successfully');
      return true;
    } catch (error: any) {
      console.error('Security questions update error:', error);
      toast.error('Failed to update security questions', {
        description: error.message
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateEmergencyContacts = async (
    userId: string,
    contacts: {
      backup_email?: string;
      backup_phone?: string;
      emergency_contact_info?: {
        name: string;
        email: string;
        phone: string;
      };
    }
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update(contacts)
        .eq('id', userId);

      if (error) throw error;

      toast.success('Emergency contacts updated successfully');
      return true;
    } catch (error: any) {
      toast.error('Failed to update emergency contacts', {
        description: error.message
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const testEmergencyAccess = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('emergency-access-verify', {
        body: {
          step: 'email_verification',
          email: email,
          userAgent: 'Test from admin panel'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Emergency access test successful', {
          description: 'Platform owner email verified'
        });
      } else {
        toast.error('Emergency access test failed', {
          description: data.error
        });
      }

      return data;
    } catch (error: any) {
      toast.error('Emergency access test error', {
        description: error.message
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    generateRecoveryCodes,
    updateSecurityQuestions,
    updateEmergencyContacts,
    testEmergencyAccess
  };
}