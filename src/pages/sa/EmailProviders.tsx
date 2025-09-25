import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Shield, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SystemEmailProvider {
  id: string;
  provider_name: string;
  provider_type: 'ses' | 'mailersend' | 'resend';
  config: Record<string, any>;
  is_default: boolean;
  is_enabled: boolean;
}

export default function EmailProviders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch system email providers
  const { data: providers, isLoading } = useQuery({
    queryKey: ['system-email-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_email_providers')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data as SystemEmailProvider[];
    }
  });

  // Update provider mutation
  const updateProvider = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SystemEmailProvider> }) => {
      const { error } = await supabase
        .from('system_email_providers')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-email-providers'] });
      toast({ title: "Success", description: "Email provider updated successfully" });
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast({ title: "Error", description: "Failed to update provider", variant: "destructive" });
    }
  });

  const setDefaultProvider = async (providerId: string) => {
    try {
      // First, remove default from all providers
      await Promise.all(
        providers?.map(p => 
          updateProvider.mutateAsync({ 
            id: p.id, 
            updates: { is_default: false } 
          })
        ) || []
      );
      
      // Then set the selected one as default
      await updateProvider.mutateAsync({ 
        id: providerId, 
        updates: { is_default: true } 
      });
    } catch (error) {
      console.error('Error setting default provider:', error);
      toast({ title: "Error", description: "Failed to set default provider", variant: "destructive" });
    }
  };

  const testProvider = async (provider: SystemEmailProvider) => {
    const testEmail = prompt('Enter email address to send test email to:');
    if (!testEmail || !testEmail.includes('@')) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    try {
      console.log('Testing provider:', provider.provider_type, 'with config:', provider.config);
      
      const { data, error } = await supabase.functions.invoke('test-email-provider', {
        body: {
          provider_type: provider.provider_type,
          config: provider.config,
          test_email: testEmail
        }
      });

      console.log('Test result:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (data?.success) {
        toast({ 
          title: "Success", 
          description: `Test email sent successfully via ${provider.provider_type.toUpperCase()} to ${testEmail}`,
          duration: 5000
        });
      } else {
        console.error('Provider test failed:', data);
        toast({ 
          title: "Test Failed", 
          description: data?.error || "Unknown error occurred during test",
          variant: "destructive",
          duration: 8000
        });
      }
    } catch (error: any) {
      console.error('Test error:', error);
      let errorMessage = "Failed to test provider";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({ 
        title: "Error", 
        description: errorMessage,
        variant: "destructive",
        duration: 8000
      });
    }
  };

  const renderProviderConfig = (provider: SystemEmailProvider) => {
    const config = provider.config || {};
    
    switch (provider.provider_type) {
      case 'ses':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>AWS Region</Label>
                <Input 
                  value={config.region || 'us-east-1'} 
                  onChange={(e) => updateProvider.mutate({
                    id: provider.id,
                    updates: { config: { ...config, region: e.target.value } }
                  })}
                  placeholder="us-east-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Access Key ID</Label>
                <Input 
                  value={config.access_key_id || ''} 
                  onChange={(e) => updateProvider.mutate({
                    id: provider.id,
                    updates: { config: { ...config, access_key_id: e.target.value } }
                  })}
                  placeholder="AKIA..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secret Access Key</Label>
              <Input 
                type="password"
                value={config.secret_access_key || ''} 
                onChange={(e) => updateProvider.mutate({
                  id: provider.id,
                  updates: { config: { ...config, secret_access_key: e.target.value } }
                })}
                placeholder="Enter secret key..."
              />
            </div>
          </div>
        );
      
      case 'mailersend':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input 
                type="password"
                value={config.api_key || ''} 
                onChange={(e) => updateProvider.mutate({
                  id: provider.id,
                  updates: { config: { ...config, api_key: e.target.value } }
                })}
                placeholder="Enter MailerSend API key..."
              />
            </div>
          </div>
        );
      
      case 'resend':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input 
                type="password"
                value={config.api_key || ''} 
                onChange={(e) => updateProvider.mutate({
                  id: provider.id,
                  updates: { config: { ...config, api_key: e.target.value } }
                })}
                placeholder="Enter Resend API key..."
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getProviderStatus = (provider: SystemEmailProvider) => {
    const config = provider.config || {};
    let hasRequiredConfig = false;
    
    switch (provider.provider_type) {
      case 'ses':
        hasRequiredConfig = !!(config.access_key_id && config.secret_access_key);
        break;
      case 'mailersend':
      case 'resend':
        hasRequiredConfig = !!config.api_key;
        break;
    }
    
    if (!provider.is_enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    if (provider.is_default) {
      return <Badge className="bg-primary">Default</Badge>;
    }
    
    if (hasRequiredConfig) {
      return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Ready</Badge>;
    }
    
    return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Not Configured</Badge>;
  };

  const hasRequiredConfig = (provider: SystemEmailProvider) => {
    const config = provider.config || {};
    
    switch (provider.provider_type) {
      case 'ses':
        return !!(config.access_key_id && config.secret_access_key);
      case 'mailersend':
      case 'resend':
        return !!config.api_key;
      default:
        return false;
    }
  };

  if (isLoading) {
    return <div>Loading email providers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Email Providers</h2>
          <p className="text-muted-foreground">
            Configure system-wide email providers that hotels can use
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {providers?.map(provider => (
          <Card key={provider.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5" />
                  <div>
                    <CardTitle>{provider.provider_name}</CardTitle>
                    <CardDescription>
                      Provider: {provider.provider_type.toUpperCase()}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getProviderStatus(provider)}
                  <Switch
                    checked={provider.is_enabled}
                    onCheckedChange={(enabled) => 
                      updateProvider.mutate({
                        id: provider.id,
                        updates: { is_enabled: enabled }
                      })
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderProviderConfig(provider)}
              
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm text-muted-foreground">
                    System Default Provider
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testProvider(provider)}
                    disabled={!provider.is_enabled || !hasRequiredConfig(provider)}
                  >
                    Test Provider
                  </Button>
                  <Button
                    variant={provider.is_default ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDefaultProvider(provider.id)}
                    disabled={!provider.is_enabled}
                  >
                    {provider.is_default ? "Current Default" : "Set as Default"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            System email provider configuration for multi-tenant SaaS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">For Hotels (Tenants)</h4>
              <p className="text-sm text-muted-foreground">
                Hotels can choose to use the system default email service (configured here) 
                or set up their own custom SMTP server in their email settings.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Provider Fallback</h4>
              <p className="text-sm text-muted-foreground">
                If the default provider fails, the system automatically tries other 
                enabled providers to ensure email delivery.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}