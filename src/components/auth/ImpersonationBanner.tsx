import { AlertTriangle, X, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';

export function ImpersonationBanner() {
  // Safely access auth context
  let auth;
  try {
    auth = useAuth();
  } catch (error) {
    // Not in auth context, return null
    return null;
  }

  const { isImpersonating, impersonationData, stopImpersonation } = auth;

  if (!isImpersonating || !impersonationData) {
    return null;
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-amber-800 dark:text-amber-200">
              IMPERSONATION MODE
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3" />
            <span className="text-amber-700 dark:text-amber-300">
              Viewing as: <strong>{impersonationData.target_user?.email}</strong>
            </span>
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              {impersonationData.target_user?.role}
            </Badge>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={stopImpersonation}
          className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-900"
        >
          <X className="h-4 w-4 mr-1" />
          Stop Impersonation
        </Button>
      </AlertDescription>
    </Alert>
  );
}