import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { toast } from 'sonner';
import type { PaymentMethod } from '@/contexts/PaymentMethodsContext';

export const usePaymentMethodsDB = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch payment methods from database
  const fetchPaymentMethods = async () => {
    if (!user?.tenant_id) {
      setPaymentMethods([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('display_order');

      if (error) throw error;

      const methods: PaymentMethod[] = (data || []).map(method => ({
        id: method.id,
        name: method.name,
        type: method.type as PaymentMethod['type'],
        icon: method.icon,
        enabled: method.enabled,
        fees: method.fees as { percentage: number; fixed: number },
        config: method.config
      }));

      setPaymentMethods(methods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  // Add new payment method
  const addPaymentMethod = async (method: Omit<PaymentMethod, 'id'>) => {
    if (!user?.tenant_id) return false;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .insert({
          tenant_id: user.tenant_id,
          name: method.name,
          type: method.type,
          icon: method.icon,
          enabled: method.enabled,
          fees: method.fees || { percentage: 0, fixed: 0 },
          config: method.config || {},
          display_order: paymentMethods.length
        });

      if (error) throw error;

      toast.success('Payment method added');
      await fetchPaymentMethods();
      return true;
    } catch (error: any) {
      console.error('Error adding payment method:', error);
      if (error.code === '23505') {
        toast.error('Payment method with this name already exists');
      } else {
        toast.error('Failed to add payment method');
      }
      return false;
    }
  };

  // Update payment method
  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    if (!user?.tenant_id) return false;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({
          name: updates.name,
          type: updates.type,
          icon: updates.icon,
          enabled: updates.enabled,
          fees: updates.fees,
          config: updates.config
        })
        .eq('id', id)
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;

      toast.success('Payment method updated');
      await fetchPaymentMethods();
      return true;
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
      return false;
    }
  };

  // Toggle payment method
  const togglePaymentMethod = async (id: string, enabled: boolean) => {
    if (!user?.tenant_id) return false;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .update({ enabled })
        .eq('id', id)
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;

      await fetchPaymentMethods();
      return true;
    } catch (error) {
      console.error('Error toggling payment method:', error);
      toast.error('Failed to update payment method');
      return false;
    }
  };

  // Delete payment method
  const deletePaymentMethod = async (id: string) => {
    if (!user?.tenant_id) return false;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;

      toast.success('Payment method removed');
      await fetchPaymentMethods();
      return true;
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Failed to remove payment method');
      return false;
    }
  };

  // Calculate fees for a payment
  const calculateFees = (amount: number, methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method?.fees) return 0;

    const percentageFee = (amount * method.fees.percentage) / 100;
    const totalFee = percentageFee + method.fees.fixed;
    return totalFee;
  };

  // Initial fetch
  useEffect(() => {
    fetchPaymentMethods();
  }, [user?.tenant_id]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.tenant_id) return;

    const channel = supabase
      .channel('payment-methods-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_methods',
          filter: `tenant_id=eq.${user.tenant_id}`
        },
        () => {
          fetchPaymentMethods();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.tenant_id]);

  const enabledMethods = paymentMethods.filter(m => m.enabled);

  return {
    paymentMethods,
    enabledMethods,
    loading,
    addPaymentMethod,
    updatePaymentMethod,
    togglePaymentMethod,
    deletePaymentMethod,
    calculateFees,
    refresh: fetchPaymentMethods
  };
};
