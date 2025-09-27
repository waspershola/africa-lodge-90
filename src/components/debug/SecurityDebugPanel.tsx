import { useState } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Shield, User, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function SecurityDebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const { user, session, tenant } = useAuth();

  const runSecurityDiagnostics = async () => {
    try {
      console.log('[SECURITY DIAGNOSTICS] Starting comprehensive security check...');
      
      // 1. Check current auth state
      const authState = {
        user: user ? {
          id: user.id,
          email: user.email,
          role: user.role,
          tenant_id: user.tenant_id
        } : null,
        session: session ? {
          expires_at: session.expires_at,
          token_type: session.token_type,
          access_token_preview: session.access_token?.substring(0, 20) + '...'
        } : null,
        tenant: tenant ? {
          tenant_id: tenant.tenant_id,
          hotel_name: tenant.hotel_name,
          subscription_status: tenant.subscription_status
        } : null
      };

      // 2. Verify database user record
      let dbUserRecord = null;
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, role, tenant_id, is_active')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('[SECURITY DIAGNOSTICS] Error fetching user from DB:', error);
        } else {
          dbUserRecord = data;
        }
      }

      // 3. Test access control functions
      const testRoles = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'STAFF'];
      const accessTests = {};
      if (user) {
        testRoles.forEach(role => {
          try {
            // Access the hasAccess function through the auth context
            const { hasAccess } = useAuth();
            accessTests[role] = hasAccess(role);
          } catch (err) {
            accessTests[role] = `Error: ${err.message}`;
          }
        });
      }

      // 4. Check localStorage/sessionStorage
      const storageInfo = {
        localStorage: {
          supabaseAuth: localStorage.getItem('sb-dxisnnjsbuuiunjmzzqj-auth-token') ? 'EXISTS' : 'NOT_FOUND',
          keys: Object.keys(localStorage).filter(key => key.includes('supabase') || key.includes('auth'))
        },
        sessionStorage: {
          keys: Object.keys(sessionStorage).filter(key => key.includes('supabase') || key.includes('auth'))
        }
      };

      // 5. Browser context info
      const browserInfo = {
        userAgent: navigator.userAgent,
        currentURL: window.location.href,
        referrer: document.referrer,
        isIncognito: 'Unknown' // Can't reliably detect incognito mode
      };

      const diagnostics = {
        timestamp: new Date().toISOString(),
        authState,
        dbUserRecord,
        accessTests,
        storageInfo,
        browserInfo,
        securityViolations: [] // Will be populated by security logs
      };

      console.log('[SECURITY DIAGNOSTICS] Complete diagnostics:', diagnostics);
      setDebugData(diagnostics);

    } catch (error) {
      console.error('[SECURITY DIAGNOSTICS] Error during diagnostics:', error);
      setDebugData({ error: error.message });
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
          <Shield className="h-4 w-4 mr-2" />
          Security Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md max-h-96 overflow-auto">
      <Card className="bg-red-50 border-red-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm text-red-700 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security Debug Panel
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runSecurityDiagnostics}
              className="w-full"
            >
              Run Security Diagnostics
            </Button>
            
            {user && (
              <div className="text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span>Role:</span>
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'destructive' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Email:</span>
                  <span className="truncate max-w-32">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Path:</span>
                  <span className="truncate max-w-32">{window.location.pathname}</span>
                </div>
              </div>
            )}

            {debugData && (
              <div className="text-xs bg-white p-2 rounded border max-h-40 overflow-auto">
                <pre>{JSON.stringify(debugData, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}