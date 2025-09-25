import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Settings, Palette, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useTenantInfo } from '@/hooks/useTenantInfo';
import { useEmailSettings, useUpdateEmailSettings, useSendTestEmail } from '@/hooks/useEmailSettings';

export default function EmailSettings() {
  const { user } = useAuth();
  const { data: tenantInfo } = useTenantInfo();
  const { data: currentEmailSettings, isLoading } = useEmailSettings();
  const updateEmailSettings = useUpdateEmailSettings();
  const sendTestEmail = useSendTestEmail();
  const { toast } = useToast();
  
  const [emailSettings, setEmailSettings] = useState({
    from_name: tenantInfo?.hotel_name ? `Hotel ${tenantInfo.hotel_name}` : '',
    from_email: '',
    reply_to_email: tenantInfo?.email || '',
    smtp_enabled: false,
    smtp_config: {
      host: '',
      port: 587,
      username: '',
      password: '',
      secure: true
    },
    email_templates: {
      confirmation: {
        subject: `Reservation Confirmation - ${tenantInfo?.hotel_name || 'Hotel'}`,
        enabled: true
      },
      invoice: {
        subject: `Invoice for Your Reservation - ${tenantInfo?.hotel_name || 'Hotel'}`,
        enabled: true
      },
      reminder: {
        subject: `Payment Reminder - ${tenantInfo?.hotel_name || 'Hotel'}`,
        enabled: true
      },
      group_confirmation: {
        subject: `Group Reservation Confirmation - ${tenantInfo?.hotel_name || 'Hotel'}`,
        enabled: true
      }
    },
    branding: {
      header_color: '#2563eb',
      accent_color: '#f59e0b',
      footer_text: 'Thank you for choosing us!'
    },
    send_to_individuals: false
  });

  // Load current settings when available
  React.useEffect(() => {
    if (currentEmailSettings) {
      setEmailSettings(currentEmailSettings);
    }
  }, [currentEmailSettings]);

  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async () => {
    try {
      await updateEmailSettings.mutateAsync(emailSettings);
    } catch (error) {
      console.error('Error saving email settings:', error);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email Required",
        description: "Please enter a test email address",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      await sendTestEmail.mutateAsync({ 
        email: testEmail, 
        type: 'confirmation' 
      });
    } catch (error) {
      console.error('Test email error:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Settings</h2>
          <p className="text-muted-foreground">
            Configure email templates and delivery settings for guest communications
          </p>
        </div>
        
        <Button onClick={handleSave}>
          <Settings className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="identity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="identity">Email Identity</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Identity
              </CardTitle>
              <CardDescription>
                Configure how emails appear to your guests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={emailSettings.from_name}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, from_name: e.target.value }))}
                    placeholder="Hotel Elegance"
                  />
                  <p className="text-xs text-muted-foreground">
                    This appears as the sender name in guest inboxes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reply_to">Reply-To Email</Label>
                  <Input
                    id="reply_to"
                    type="email"
                    value={emailSettings.reply_to_email}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, reply_to_email: e.target.value }))}
                    placeholder="frontdesk@yourhotel.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Guests will reply to this email address
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_email">From Email (Optional - Custom Domain)</Label>
                <Input
                  id="from_email"
                  type="email"
                  value={emailSettings.from_email}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, from_email: e.target.value }))}
                  placeholder="reservations@yourhotel.com"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use default system email. Custom domain requires SMTP setup.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(emailSettings.email_templates).map(([key, template]) => (
              <Card key={key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{key.replace('_', ' ')} Email</CardTitle>
                    <Switch
                      checked={template.enabled}
                      onCheckedChange={(checked) => 
                        setEmailSettings(prev => ({
                          ...prev,
                          email_templates: {
                            ...prev.email_templates,
                            [key]: { ...template, enabled: checked }
                          }
                        }))
                      }
                    />
                  </div>
                  <CardDescription>
                    Sent to guests when {key === 'confirmation' ? 'reservation is confirmed' :
                                     key === 'invoice' ? 'invoice is generated' :
                                     key === 'reminder' ? 'payment is due' : 'group booking is made'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Subject Line</Label>
                    <Input
                      value={template.subject}
                      onChange={(e) => 
                        setEmailSettings(prev => ({
                          ...prev,
                          email_templates: {
                            ...prev.email_templates,
                            [key]: { ...template, subject: e.target.value }
                          }
                        }))
                      }
                      placeholder="Enter email subject"
                    />
                      <p className="text-xs text-muted-foreground mt-2">
                        Use {`{{hotel_name}}`} and {`{{guest_name}}`} for dynamic content
                      </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Group Booking Options</CardTitle>
              <CardDescription>
                Configure how group booking emails are handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="send_individuals"
                  checked={emailSettings.send_to_individuals}
                  onCheckedChange={(checked) => 
                    setEmailSettings(prev => ({ ...prev, send_to_individuals: checked }))
                  }
                />
                <Label htmlFor="send_individuals">Send individual confirmations to each guest</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                When enabled, each guest in a group booking receives their own reservation details via email
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Email Branding
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your email communications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="header_color">Header Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="header_color"
                      type="color"
                      value={emailSettings.branding.header_color}
                      onChange={(e) => setEmailSettings(prev => ({
                        ...prev,
                        branding: { ...prev.branding, header_color: e.target.value }
                      }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={emailSettings.branding.header_color}
                      onChange={(e) => setEmailSettings(prev => ({
                        ...prev,
                        branding: { ...prev.branding, header_color: e.target.value }
                      }))}
                      placeholder="#2563eb"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="accent_color"
                      type="color"
                      value={emailSettings.branding.accent_color}
                      onChange={(e) => setEmailSettings(prev => ({
                        ...prev,
                        branding: { ...prev.branding, accent_color: e.target.value }
                      }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={emailSettings.branding.accent_color}
                      onChange={(e) => setEmailSettings(prev => ({
                        ...prev,
                        branding: { ...prev.branding, accent_color: e.target.value }
                      }))}
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Text</Label>
                <Textarea
                  id="footer_text"
                  value={emailSettings.branding.footer_text}
                  onChange={(e) => setEmailSettings(prev => ({
                    ...prev,
                    branding: { ...prev.branding, footer_text: e.target.value }
                  }))}
                  placeholder="Thank you for choosing us!"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                Preview how your emails will appear to guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4" style={{ 
                background: emailSettings.branding.header_color + '20',
                borderLeft: `4px solid ${emailSettings.branding.accent_color}`
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ background: emailSettings.branding.header_color }}
                  ></div>
                  <strong>{emailSettings.from_name || tenantInfo?.hotel_name}</strong>
                </div>
                <p className="text-sm text-muted-foreground">
                  Subject: Reservation Confirmation - {tenantInfo?.hotel_name}
                </p>
                <p className="text-sm mt-2">{emailSettings.branding.footer_text}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Delivery Method</CardTitle>
              <CardDescription>
                Choose between system default email service or custom SMTP server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="system_email"
                    name="email_method"
                    checked={!emailSettings.smtp_enabled}
                    onChange={() => setEmailSettings(prev => ({ ...prev, smtp_enabled: false }))}
                  />
                  <Label htmlFor="system_email">Use System Default Email Service</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Use the email service configured by the system administrator. This is the recommended option.
                </p>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="custom_smtp"
                    name="email_method"
                    checked={emailSettings.smtp_enabled}
                    onChange={() => setEmailSettings(prev => ({ ...prev, smtp_enabled: true }))}
                  />
                  <Label htmlFor="custom_smtp">Use Custom SMTP Server</Label>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  Configure your own SMTP server for complete control over email delivery.
                </p>
              </div>
              
              {emailSettings.smtp_enabled && (
                <div className="grid gap-4 md:grid-cols-2 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP Host</Label>
                    <Input
                      id="smtp_host"
                      value={emailSettings.smtp_config.host}
                      onChange={(e) => setEmailSettings(prev => ({
                        ...prev,
                        smtp_config: { ...prev.smtp_config, host: e.target.value }
                      }))}
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">Port</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={emailSettings.smtp_config.port}
                      onChange={(e) => setEmailSettings(prev => ({
                        ...prev,
                        smtp_config: { ...prev.smtp_config, port: Number(e.target.value) }
                      }))}
                      placeholder="587"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="smtp_username">Username</Label>
                    <Input
                      id="smtp_username"
                      value={emailSettings.smtp_config.username}
                      onChange={(e) => setEmailSettings(prev => ({
                        ...prev,
                        smtp_config: { ...prev.smtp_config, username: e.target.value }
                      }))}
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-3">Test Email Delivery</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button onClick={handleTestEmail} disabled={isTesting || sendTestEmail.isPending}>
                    <Send className="h-4 w-4 mr-2" />
                    {isTesting || sendTestEmail.isPending ? 'Sending...' : 'Send Test'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Send a test confirmation email to verify your settings
                </p>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Multi-Tenant Email Security</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        All emails are automatically tenant-isolated. Guests will only see information 
                        about your hotel and their specific reservations. Your hotel branding, colors, 
                        and contact information are used exclusively.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}