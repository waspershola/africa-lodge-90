import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Key, 
  Users, 
  RefreshCw, 
  AlertTriangle,
  Copy,
  Download
} from 'lucide-react';
import { useRecoveryManagement } from '@/hooks/useRecoveryManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SystemOwnerManagement } from './SystemOwnerManagement';
import { Button } from '@/components/ui/button';

interface SystemOwner {
  id: string;
  email: string;
  name: string;
  role: string;
  is_platform_owner: boolean;
  force_reset?: boolean;
  security_questions?: any;
  recovery_codes?: any;
  backup_email?: string;
  backup_phone?: string;
  last_login?: string;
  created_at: string;
}

export function EmergencyRecoverySettings() {
  // System management page - updated with SystemOwnerManagement component
  const [systemOwners, setSystemOwners] = useState<SystemOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const [masterKeyHash, setMasterKeyHash] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  const { 
    generateRecoveryCodes, 
    testEmergencyAccess,
    loading: recoveryLoading 
  } = useRecoveryManagement();

  useEffect(() => {
    loadSystemOwners();
    loadMasterKeyStatus();
  }, []);

  const loadSystemOwners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, role, is_platform_owner, force_reset, security_questions, recovery_codes, last_login, created_at')
        .eq('is_platform_owner', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSystemOwners(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterKeyStatus = async () => {
    try {
      const { data } = await supabase.functions.invoke('emergency-access-verify', {
        body: {
          step: 'master_key',
          sessionToken: 'test',
          masterKey: 'test'
        }
      });
      
      if (data?.error?.includes('Master recovery key not configured')) {
        setMasterKeyHash('NOT_CONFIGURED');
      } else {
        setMasterKeyHash('CONFIGURED');
      }
    } catch (error) {
      setMasterKeyHash('UNKNOWN');
    }
  };

  const handleGenerateRecoveryCodes = async (userId: string) => {
    const codes = await generateRecoveryCodes(userId);
    if (codes) {
      setGeneratedCodes(codes);
      loadSystemOwners();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const downloadCodes = () => {
    if (!generatedCodes.length) return;
    
    const content = generatedCodes.map((code, index) => `${index + 1}. ${code}`).join('\n');
    const blob = new Blob([
      `EMERGENCY RECOVERY CODES\n`,
      `Generated: ${new Date().toISOString()}\n`,
      `IMPORTANT: Store these codes securely. Each code can only be used once.\n\n`,
      content
    ], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Emergency Recovery Settings</h2>
          <p className="text-muted-foreground">
            Manage system owners and emergency access configuration
          </p>
        </div>
        <Badge variant={systemOwners.length >= 3 ? 'default' : 'destructive'}>
          {systemOwners.length}/3 System Owners
        </Badge>
      </div>

      {/* System Owner Management - Primary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Owner Quick Actions
          </CardTitle>
          <CardDescription>
            Quick reset actions for all system owners. For individual management, visit System Owner Management page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button 
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('create-system-owners');
                  if (error) throw error;
                  if (data?.success) {
                    toast.success(data.message);
                    const createdOwners = data.results?.filter((r: any) => r.status === 'created');
                    if (createdOwners?.length > 0) {
                      console.log('System owners created:', createdOwners);
                    }
                  } else {
                    toast.error('Failed to create system owners');
                  }
                } catch (error: any) {
                  toast.error(`Failed to create system owners: ${error.message}`);
                }
              }}
              variant="default"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Create System Owners
            </Button>
            <Button 
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke('reset-system-owner-passwords');
                  if (error) throw error;
                  if (data?.success) {
                    toast.success('All system owner passwords reset successfully');
                  } else {
                    toast.error(data?.message || 'Failed to reset passwords');
                  }
                } catch (error: any) {
                  toast.error(`Failed to reset passwords: ${error.message}`);
                }
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset All Passwords
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>System Owners: wasperstore@gmail.com, info@waspersolution.com, sholawasiu@gmail.com</p>
            <p className="mt-1">For individual recovery settings, visit <strong>System Owner Management</strong> page.</p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Master Key Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Master Recovery Key
          </CardTitle>
          <CardDescription>
            Emergency master key stored in Supabase secrets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                Master key configuration status
              </p>
            </div>
            <Badge variant={masterKeyHash === 'CONFIGURED' ? 'default' : 'destructive'}>
              {masterKeyHash === 'CONFIGURED' ? 'Configured' : 
               masterKeyHash === 'NOT_CONFIGURED' ? 'Not Configured' : 'Unknown'}
            </Badge>
          </div>
          
          {masterKeyHash === 'NOT_CONFIGURED' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Master recovery key is not configured. Please set MASTER_RECOVERY_KEY_HASH in Supabase secrets.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Recovery Codes */}
      {generatedCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Generated Recovery Codes
            </CardTitle>
            <CardDescription>
              Save these codes in a secure location. Each can only be used once.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                These recovery codes will only be shown once. Make sure to save them securely.
              </AlertDescription>
            </Alert>
            
            <div className="bg-muted rounded-lg p-4 font-mono text-sm">
              {generatedCodes.map((code, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span>{index + 1}. {code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button onClick={downloadCodes}>
                <Download className="h-4 w-4 mr-2" />
                Download as File
              </Button>
              <Button 
                variant="outline"
                onClick={() => copyToClipboard(generatedCodes.join('\n'))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}