import { useState } from 'react';
import { useAuth } from '@/hooks/useMultiTenantAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, LogOut } from 'lucide-react';

export function AuthDebugInfo() {
  const { user, session, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleRefreshToken = async () => {
    console.log('Manually refreshing token...');
    window.location.reload(); // Simple refresh for now
  };

  const handleLogout = async () => {
    // Prevent double-clicks
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <Card className="mb-6 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">🔧 Auth Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium">Current User:</p>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
            {user ? JSON.stringify(user, null, 2) : 'No user'}
          </pre>
        </div>
        
        {session?.access_token && (
          <div>
            <p className="text-sm font-medium">JWT Claims:</p>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(
                JSON.parse(atob(session.access_token.split('.')[1])), 
                null, 
                2
              )}
            </pre>
          </div>
        )}
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleRefreshToken}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? (
              <>
                <div className="h-3 w-3 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="h-3 w-3 mr-1" />
                Logout & Re-login
              </>
            )}
          </Button>
        </div>
        
        <p className="text-xs text-yellow-700">
          If tenants are not showing, try logging out and back in to refresh JWT claims.
        </p>
      </CardContent>
    </Card>
  );
}