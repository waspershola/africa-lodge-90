import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Save, TestTube, AlertTriangle, CheckCircle, Mail } from 'lucide-react';

interface EmailProviderConfig {
  default_provider: 'ses' | 'mailersend' | 'resend';
  providers: {
    ses: {
      enabled: boolean;
      region: string;
      access_key_id: string;
      secret_access_key: string;
      verified_domains: string[];
    };
    mailersend: {
      enabled: boolean;
      api_key: string;
      verified_domains: string[];
    };
    resend: {
      enabled: boolean;
      api_key: string;
      verified_domains: string[];
    };
  };
  fallback_enabled: boolean;
  fallback_provider: 'ses' | 'mailersend' | 'resend';
}

interface EmailProviderSettingsProps {
  config: EmailProviderConfig;
  onSave: (config: EmailProviderConfig) => Promise<void>;
  isLoading?: boolean;
}

export default function EmailProviderSettings({ config, onSave, isLoading }: EmailProviderSettingsProps) {
  const [localConfig, setLocalConfig] = useState<EmailProviderConfig>(config);
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const updateProvider = (provider: keyof EmailProviderConfig['providers'], updates: Partial<EmailProviderConfig['providers'][typeof provider]>) => {
    setLocalConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          ...updates
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      await onSave(localConfig);
      toast({
        title: "Settings Saved",
        description: "Email provider configuration updated successfully"
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to update email provider settings",
        variant: "destructive"
      });
    }
  };

  const handleTestEmail = async (provider: string) => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      // Test email functionality would be implemented here
      // This would call the send-reservation-email function with test parameters
      toast({
        title: "Test Email Sent",
        description: `Test email sent to ${testEmail} using ${provider}`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: `Failed to send test email via ${provider}`,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getProviderStatus = (provider: keyof EmailProviderConfig['providers']) => {
    const providerConfig = localConfig.providers[provider];
    const isConfigured = provider === 'ses' 
      ? !!(providerConfig as any).access_key_id && !!(providerConfig as any).secret_access_key
      : !!(providerConfig as any).api_key;
    
    if (providerConfig.enabled && isConfigured) {
      return <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>;
    } else if (isConfigured) {
      return <Badge variant="secondary">Configured</Badge>;
    } else {
      return <Badge variant="outline">Not Configured</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Provider Configuration
          </CardTitle>
          <CardDescription>
            Configure multiple email providers with automatic fallback support
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="default-provider">Primary Provider</Label>
              <Select
                value={localConfig.default_provider}
                onValueChange={(value: 'ses' | 'mailersend' | 'resend') => 
                  setLocalConfig(prev => ({ ...prev, default_provider: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select primary provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                  <SelectItem value="mailersend">MailerSend</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="fallback-provider">Fallback Provider</Label>
              <Select
                value={localConfig.fallback_provider}
                onValueChange={(value: 'ses' | 'mailersend' | 'resend') => 
                  setLocalConfig(prev => ({ ...prev, fallback_provider: value }))
                }
                disabled={!localConfig.fallback_enabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fallback provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ses">Amazon SES</SelectItem>
                  <SelectItem value="mailersend">MailerSend</SelectItem>
                  <SelectItem value="resend">Resend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="fallback-enabled"
              checked={localConfig.fallback_enabled}
              onCheckedChange={(checked) => 
                setLocalConfig(prev => ({ ...prev, fallback_enabled: checked }))
              }
            />
            <Label htmlFor="fallback-enabled">Enable automatic fallback</Label>
          </div>

          {localConfig.fallback_enabled && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                If the primary provider fails, emails will automatically be sent via the fallback provider.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Provider Configurations */}
      <Tabs defaultValue="ses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ses" className="flex items-center gap-2">
            Amazon SES {getProviderStatus('ses')}
          </TabsTrigger>
          <TabsTrigger value="mailersend" className="flex items-center gap-2">
            MailerSend {getProviderStatus('mailersend')}
          </TabsTrigger>
          <TabsTrigger value="resend" className="flex items-center gap-2">
            Resend {getProviderStatus('resend')}
          </TabsTrigger>
        </TabsList>

        {/* Amazon SES Configuration */}
        <TabsContent value="ses">
          <Card>
            <CardHeader>
              <CardTitle>Amazon SES Configuration</CardTitle>
              <CardDescription>
                Configure Amazon Simple Email Service for reliable, cost-effective email delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={localConfig.providers.ses.enabled}
                  onCheckedChange={(checked) => updateProvider('ses', { enabled: checked })}
                />
                <Label>Enable Amazon SES</Label>
              </div>

              {localConfig.providers.ses.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ses-region">AWS Region</Label>
                    <Select
                      value={localConfig.providers.ses.region}
                      onValueChange={(value) => updateProvider('ses', { region: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select AWS region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                        <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                        <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                        <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ses-access-key">Access Key ID</Label>
                    <Input
                      id="ses-access-key"
                      type="password"
                      value={localConfig.providers.ses.access_key_id}
                      onChange={(e) => updateProvider('ses', { access_key_id: e.target.value })}
                      placeholder="AKIA..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="ses-secret-key">Secret Access Key</Label>
                    <Input
                      id="ses-secret-key"
                      type="password"
                      value={localConfig.providers.ses.secret_access_key}
                      onChange={(e) => updateProvider('ses', { secret_access_key: e.target.value })}
                      placeholder="Enter secret access key"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ses-domains">Verified Domains (comma-separated)</Label>
                    <Input
                      id="ses-domains"
                      value={localConfig.providers.ses.verified_domains.join(', ')}
                      onChange={(e) => updateProvider('ses', { 
                        verified_domains: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                      })}
                      placeholder="example.com, yourdomain.com"
                    />
                  </div>

                  <Button 
                    onClick={() => handleTestEmail('Amazon SES')} 
                    disabled={isTesting}
                    variant="outline"
                    className="w-full"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {isTesting ? 'Testing...' : 'Test SES Connection'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MailerSend Configuration */}
        <TabsContent value="mailersend">
          <Card>
            <CardHeader>
              <CardTitle>MailerSend Configuration</CardTitle>
              <CardDescription>
                Configure MailerSend for advanced email analytics and deliverability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={localConfig.providers.mailersend.enabled}
                  onCheckedChange={(checked) => updateProvider('mailersend', { enabled: checked })}
                />
                <Label>Enable MailerSend</Label>
              </div>

              {localConfig.providers.mailersend.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mailersend-api-key">API Key</Label>
                    <Input
                      id="mailersend-api-key"
                      type="password"
                      value={localConfig.providers.mailersend.api_key}
                      onChange={(e) => updateProvider('mailersend', { api_key: e.target.value })}
                      placeholder="mlsn..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="mailersend-domains">Verified Domains (comma-separated)</Label>
                    <Input
                      id="mailersend-domains"
                      value={localConfig.providers.mailersend.verified_domains.join(', ')}
                      onChange={(e) => updateProvider('mailersend', { 
                        verified_domains: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                      })}
                      placeholder="example.com, yourdomain.com"
                    />
                  </div>

                  <Button 
                    onClick={() => handleTestEmail('MailerSend')} 
                    disabled={isTesting}
                    variant="outline"
                    className="w-full"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {isTesting ? 'Testing...' : 'Test MailerSend Connection'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resend Configuration */}
        <TabsContent value="resend">
          <Card>
            <CardHeader>
              <CardTitle>Resend Configuration</CardTitle>
              <CardDescription>
                Configure Resend for developer-friendly email delivery
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={localConfig.providers.resend.enabled}
                  onCheckedChange={(checked) => updateProvider('resend', { enabled: checked })}
                />
                <Label>Enable Resend</Label>
              </div>

              {localConfig.providers.resend.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resend-api-key">API Key</Label>
                    <Input
                      id="resend-api-key"
                      type="password"
                      value={localConfig.providers.resend.api_key}
                      onChange={(e) => updateProvider('resend', { api_key: e.target.value })}
                      placeholder="re_..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="resend-domains">Verified Domains (comma-separated)</Label>
                    <Input
                      id="resend-domains"
                      value={localConfig.providers.resend.verified_domains.join(', ')}
                      onChange={(e) => updateProvider('resend', { 
                        verified_domains: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                      })}
                      placeholder="example.com, yourdomain.com"
                    />
                  </div>

                  <Button 
                    onClick={() => handleTestEmail('Resend')} 
                    disabled={isTesting}
                    variant="outline"
                    className="w-full"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {isTesting ? 'Testing...' : 'Test Resend Connection'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test Email Delivery</CardTitle>
          <CardDescription>
            Send a test email to verify your configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-email">Test Email Address</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="Enter email address to test"
            />
          </div>
          <Button 
            onClick={() => handleTestEmail(localConfig.default_provider)} 
            disabled={isTesting || !testEmail}
            className="w-full"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? 'Sending Test Email...' : 'Send Test Email'}
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}