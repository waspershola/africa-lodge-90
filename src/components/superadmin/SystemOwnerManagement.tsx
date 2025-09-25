import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, RefreshCw, Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function SystemOwnerManagement() {
  const [isCreatingOwners, setIsCreatingOwners] = useState(false);
  const [isResettingPasswords, setIsResettingPasswords] = useState(false);
  const [lastResults, setLastResults] = useState<any>(null);

  const createSystemOwners = async () => {
    setIsCreatingOwners(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-system-owners');
      
      if (error) {
        console.error('Error creating system owners:', error);
        toast.error(`Failed to create system owners: ${error.message}`);
        return;
      }

      setLastResults(data);
      
      if (data?.success) {
        const successCount = data.results?.filter((r: any) => r.success).length || 0;
        const totalCount = data.results?.length || 0;
        toast.success(`System owner creation completed: ${successCount}/${totalCount} successful`);
      } else {
        toast.error(data?.message || 'Failed to create system owners');
      }
    } catch (error: any) {
      console.error('Error creating system owners:', error);
      toast.error(`Failed to create system owners: ${error.message}`);
    } finally {
      setIsCreatingOwners(false);
    }
  };

  const resetSystemOwnerPasswords = async () => {
    setIsResettingPasswords(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-system-owner-passwords');
      
      if (error) {
        console.error('Error resetting passwords:', error);
        toast.error(`Failed to reset passwords: ${error.message}`);
        return;
      }

      setLastResults(data);
      
      if (data?.success) {
        const successCount = data.results?.filter((r: any) => r.success).length || 0;
        const totalCount = data.results?.length || 0;
        toast.success(`Password reset completed: ${successCount}/${totalCount} successful`);
      } else {
        toast.error(data?.message || 'Failed to reset passwords');
      }
    } catch (error: any) {
      console.error('Error resetting passwords:', error);
      toast.error(`Failed to reset passwords: ${error.message}`);
    } finally {
      setIsResettingPasswords(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Owner Management
          </CardTitle>
          <CardDescription>
            Create and manage system owner accounts for platform administration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={createSystemOwners}
              disabled={isCreatingOwners}
              className="flex items-center gap-2"
            >
              {isCreatingOwners ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isCreatingOwners ? 'Creating...' : 'Create System Owners'}
            </Button>

            <Button 
              onClick={resetSystemOwnerPasswords}
              disabled={isResettingPasswords}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isResettingPasswords ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {isResettingPasswords ? 'Resetting...' : 'Reset Passwords'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>System Owners:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>wasperstore@gmail.com - Super Admin</li>
              <li>ceo@waspersolution.com - CEO</li>
              <li>waspershola@gmail.com - System Owner</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {lastResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Last Operation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lastResults.results?.map((result: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{result.email}</span>
                    <span className="text-sm text-muted-foreground">
                      {result.message || (result.success ? 'Success' : result.error)}
                    </span>
                    {result.tempPassword && (
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        Password: {result.tempPassword}
                      </span>
                    )}
                  </div>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}