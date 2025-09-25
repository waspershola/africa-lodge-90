import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Key, 
  Users, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Copy,
  Download,
  Plus
} from 'lucide-react';
import { useRecoveryManagement } from '@/hooks/useRecoveryManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [systemOwners, setSystemOwners] = useState<SystemOwner[]>([]);
  const [loading, setLoading] = useState(false);
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerTempPassword, setNewOwnerTempPassword] = useState('');
  const [masterKeyHash, setMasterKeyHash] = useState('');
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  const { 
    generateRecoveryCodes, 
    updateSecurityQuestions, 
    updateEmergencyContacts,
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
        .select('*')
        .eq('is_platform_owner', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSystemOwners(data || []);
    } catch (error: any) {
      toast.error('Failed to load system owners', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMasterKeyStatus = async () => {
    // Check if master key is configured by testing environment
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

  const removeSystemOwner = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as a system owner?`)) {
      return;
    }

    setLoading(true);
    try {
      // Update user to remove platform owner status
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_platform_owner: false
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast.success('System owner removed successfully');
      loadSystemOwners();
    } catch (error: any) {
      toast.error('Failed to remove system owner', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSystemOwner = async () => {
    if (!newOwnerEmail || !newOwnerName) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Use the create-global-user-fixed edge function
      const { data, error } = await supabase.functions.invoke('create-global-user-fixed', {
        body: {
          email: newOwnerEmail,
          name: newOwnerName,
          role: 'Super Admin',
          temporaryPassword: newOwnerTempPassword || undefined
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to create user');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Update user to mark as platform owner
      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_platform_owner: true
        })
        .eq('id', data.user.id);

      if (updateError) throw updateError;

      toast.success('System owner added successfully', {
        description: `Temporary password: ${data.tempPassword}`
      });
      setNewOwnerEmail('');
      setNewOwnerName('');
      setNewOwnerTempPassword('');
      loadSystemOwners();
    } catch (error: any) {
      toast.error('Failed to add system owner', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRecoveryCodes = async (userId: string) => {
    const codes = await generateRecoveryCodes(userId);
    if (codes) {
      setGeneratedCodes(codes);
      loadSystemOwners(); // Refresh to show updated codes count
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
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

      {/* System Owners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            System Owners
          </CardTitle>
          <CardDescription>
            Platform owners with emergency access privileges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Owner */}
          {systemOwners.length < 3 && (
            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New System Owner
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newOwnerName">Full Name</Label>
                  <Input
                    id="newOwnerName"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newOwnerEmail">Email Address</Label>
                  <Input
                    id="newOwnerEmail"
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newOwnerTempPassword">Temporary Password (Optional)</Label>
                <Input
                  id="newOwnerTempPassword"
                  type="password"
                  value={newOwnerTempPassword}
                  onChange={(e) => setNewOwnerTempPassword(e.target.value)}
                  placeholder="Leave empty to auto-generate"
                />
                <p className="text-xs text-muted-foreground">
                  If left empty, a secure temporary password will be generated automatically
                </p>
              </div>
              <Button 
                onClick={handleAddSystemOwner}
                disabled={loading || !newOwnerEmail || !newOwnerName}
              >
                Add System Owner
              </Button>
            </div>
          )}

          <Separator />

          {/* Existing Owners */}
          <div className="space-y-4">
            {systemOwners.map((owner) => (
              <div key={owner.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">{owner.name || owner.email}</h4>
                    <p className="text-sm text-muted-foreground">{owner.email}</p>
                    {owner.last_login && (
                      <p className="text-xs text-muted-foreground">
                        Last login: {new Date(owner.last_login).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Platform Owner</Badge>
                    {owner.force_reset && (
                      <Badge variant="destructive">Reset Required</Badge>
                    )}
                  </div>
                </div>

                {/* Show temporary passwords for reset required users */}
                {owner.force_reset && (owner.email === 'ceo@waspersolution.com' || owner.email === 'waspershola@gmail.com') && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm font-medium text-amber-800">Temporary Password Required</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Use this password for first login: <span className="font-mono font-bold">
                        {owner.email === 'ceo@waspersolution.com' ? 'TempPass2024!' : 'TempPass2025!'}
                      </span>
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      You will be required to change this password on first login
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Security Questions</p>
                    <p className="text-muted-foreground">
                      {owner.security_questions?.length || 0} configured
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Recovery Codes</p>
                    <p className="text-muted-foreground">
                      {owner.recovery_codes?.length || 0} available
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Backup Contacts</p>
                    <p className="text-muted-foreground">
                      {(owner.backup_email || owner.backup_phone) ? 'Configured' : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateRecoveryCodes(owner.id)}
                    disabled={recoveryLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Recovery Codes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testEmergencyAccess(owner.email)}
                    disabled={recoveryLoading}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Test Emergency Access
                  </Button>
                  {owner.email.includes('backup-admin') && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeSystemOwner(owner.id, owner.email)}
                      disabled={loading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
