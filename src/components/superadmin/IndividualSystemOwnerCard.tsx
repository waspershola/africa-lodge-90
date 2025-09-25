import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, RefreshCw, Shield, User, Mail, Key } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SystemOwner {
  email: string;
  name: string;
  role: string;
  description: string;
}

interface IndividualSystemOwnerCardProps {
  owner: SystemOwner;
  isExisting?: boolean;
}

export function IndividualSystemOwnerCard({ owner, isExisting = false }: IndividualSystemOwnerCardProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastPassword, setLastPassword] = useState<string | null>(null);

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
        setLastPassword(data.tempPassword);
        toast.success(`${owner.name} created successfully`);
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

  const resetPassword = async () => {
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-temp-password', {
        body: {
          email: owner.email
        }
      });

      if (error) {
        console.error('Error resetting password:', error);
        toast.error(`Failed to reset password for ${owner.name}: ${error.message}`);
        return;
      }

      if (data?.success) {
        setLastPassword(data.tempPassword);
        toast.success(`Password reset for ${owner.name}`);
      } else {
        toast.error(data?.error || `Failed to reset password for ${owner.name}`);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast.error(`Failed to reset password for ${owner.name}: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const copyPassword = () => {
    if (lastPassword) {
      navigator.clipboard.writeText(lastPassword);
      toast.success('Password copied to clipboard');
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

        <div className="flex flex-col gap-2">
          {!isExisting && (
            <Button 
              onClick={createOwner}
              disabled={isCreating}
              className="w-full"
              size="sm"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Owner
                </>
              )}
            </Button>
          )}

          <Button 
            onClick={resetPassword}
            disabled={isResetting}
            variant="outline"
            className="w-full"
            size="sm"
          >
            {isResetting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Resetting...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </div>

        {lastPassword && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Temporary Password:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-background px-2 py-1 rounded border">
                {lastPassword}
              </code>
              <Button
                onClick={copyPassword}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                📋
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Save this password securely. It won't be shown again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}