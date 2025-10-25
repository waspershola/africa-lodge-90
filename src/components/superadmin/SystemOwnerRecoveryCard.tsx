// @ts-nocheck
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Shield, User, Mail, Key, Settings, Phone, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SystemOwner {
  email: string;
  name: string;
  role: string;
  description: string;
}

interface SystemOwnerRecoveryCardProps {
  owner: SystemOwner;
  isExisting?: boolean;
}

export function SystemOwnerRecoveryCard({ owner, isExisting = false }: SystemOwnerRecoveryCardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const createOwner = async () => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-global-user', {
        body: {
          email: owner.email,
          name: owner.name,
          role: owner.role
        }
      });

      if (error) {
        console.error('Error creating owner:', error);
        toast.error(`Failed to create ${owner.name}: ${error.message}`);
        return;
      }

      if (data?.success) {
        toast.success(`${owner.name} created successfully with temporary password: ${data.tempPassword}`);
      } else {
        toast.error(data?.error || `Failed to create ${owner.name}`);
      }
    } catch (error: any) {
      console.error('Error creating owner:', error);
      toast.error(`Failed to create ${owner.name}: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const saveRecoverySettings = async () => {
    if (!recoveryEmail && !recoveryPhone) {
      toast.error('Please provide at least one recovery method');
      return;
    }

    setIsSaving(true);
    try {
      // Update user recovery information
      const { error } = await supabase
        .from('users')
        .update({
          backup_email: recoveryEmail || null,
          backup_phone: recoveryPhone || null,
        })
        .eq('email', owner.email);

      if (error) throw error;

      toast.success('Recovery settings saved successfully');
    } catch (error: any) {
      console.error('Error saving recovery settings:', error);
      toast.error('Failed to save recovery settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          {owner.name}
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {owner.email}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <Shield className="h-3 w-3" />
            {owner.role}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">{owner.description}</p>
        </div>

        {!isExisting && (
          <div className="pt-2">
            <Button 
              onClick={createOwner}
              disabled={isCreating}
              className="w-full"
              size="sm"
            >
              {isCreating ? (
                <>
                  <Key className="h-4 w-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create System Owner Account
                </>
              )}
            </Button>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Settings className="h-4 w-4" />
            Recovery Settings
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor={`recovery-email-${owner.email}`} className="text-sm">
                Recovery Email
              </Label>
              <Input
                id={`recovery-email-${owner.email}`}
                type="email"
                placeholder="backup@example.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor={`recovery-phone-${owner.email}`} className="text-sm">
                Recovery Phone
              </Label>
              <Input
                id={`recovery-phone-${owner.email}`}
                type="tel"
                placeholder="+1234567890"
                value={recoveryPhone}
                onChange={(e) => setRecoveryPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button 
              onClick={saveRecoverySettings}
              disabled={isSaving}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Key className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Recovery Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}