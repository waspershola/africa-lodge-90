import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

const DEFAULT_PAYMENT_METHODS = [
  {
    name: 'Cash',
    type: 'cash' as const,
    icon: 'Banknote',
    enabled: true,
    fees: { percentage: 0, fixed: 0 },
    config: {},
    display_order: 0
  },
  {
    name: 'Card',
    type: 'pos' as const,
    icon: 'CreditCard',
    enabled: true,
    fees: { percentage: 1.5, fixed: 0 },
    config: {},
    display_order: 1
  },
  {
    name: 'Bank Transfer',
    type: 'transfer' as const,
    icon: 'Building',
    enabled: true,
    fees: { percentage: 0, fixed: 0 },
    config: {},
    display_order: 2
  },
  {
    name: 'POS Terminal',
    type: 'pos' as const,
    icon: 'CreditCard',
    enabled: true,
    fees: { percentage: 1.5, fixed: 50 },
    config: {},
    display_order: 3
  },
  {
    name: 'Digital Wallet',
    type: 'digital' as const,
    icon: 'Smartphone',
    enabled: true,
    fees: { percentage: 1, fixed: 0 },
    config: {},
    display_order: 4
  }
];

export const usePaymentMethodsSeeding = () => {
  const { user } = useAuth();
  const [seeded, setSeeded] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const seedDefaultMethods = async () => {
    if (!user?.tenant_id || seeding || seeded) return;

    try {
      setSeeding(true);

      // Check if tenant already has payment methods
      const { data: existing, error: checkError } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('tenant_id', user.tenant_id)
        .limit(1);

      if (checkError) throw checkError;

      // If methods exist, don't seed
      if (existing && existing.length > 0) {
        setSeeded(true);
        return;
      }

      // Seed default payment methods
      const methodsToInsert = DEFAULT_PAYMENT_METHODS.map(method => ({
        ...method,
        tenant_id: user.tenant_id
      }));

      const { error: insertError } = await supabase
        .from('payment_methods')
        .insert(methodsToInsert);

      if (insertError) throw insertError;

      console.log('✅ Default payment methods seeded for tenant:', user.tenant_id);
      setSeeded(true);
    } catch (error) {
      console.error('Error seeding payment methods:', error);
    } finally {
      setSeeding(false);
    }
  };

  useEffect(() => {
    if (user?.tenant_id && !seeded && !seeding) {
      seedDefaultMethods();
    }
  }, [user?.tenant_id]);

  return { seeded, seeding, seedDefaultMethods };
};
