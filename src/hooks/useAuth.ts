// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthUser extends User {
  name?: string;
  role?: string;
  tenant_id?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // G.6: Fallback timeout - don't block app indefinitely
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('[Auth] Loading timeout - forcing ready state');
        setLoading(false);
      }
    }, 15000); // 15 second max loading time

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get additional user data from our users table
        const { data: userData } = await supabase
          .from('users')
          .select('name, role, tenant_id')
          .eq('id', session.user.id)
          .single();

        setUser({
          ...session.user,
          name: userData?.name || session.user.user_metadata?.name,
          role: userData?.role || session.user.user_metadata?.role,
          tenant_id: userData?.tenant_id || session.user.user_metadata?.tenant_id,
        });
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Get additional user data from our users table
          const { data: userData } = await supabase
            .from('users')
            .select('name, role, tenant_id')
            .eq('id', session.user.id)
            .single();

          setUser({
            ...session.user,
            name: userData?.name || session.user.user_metadata?.name,
            role: userData?.role || session.user.user_metadata?.role,
            tenant_id: userData?.tenant_id || session.user.user_metadata?.tenant_id,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [loading]);

  return { user, loading };
};