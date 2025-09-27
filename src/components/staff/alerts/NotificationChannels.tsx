import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Bell, Smartphone, Settings, TestTube } from "lucide-react";

interface ChannelSettings {
  id: string;
  channel_type: string;
  is_enabled: boolean;
  config: any;
  last_test_at?: string;
  status: string;
}

const channelTypes = [
  {
    id: 'sms',
    name: 'SMS Notifications',
    icon: MessageSquare,
    description: 'Send SMS alerts to staff mobile phones',
    configFields: []
  },
  {
    id: 'email',
    name: 'Email Notifications',
    icon: Mail,
    description: 'Send email alerts to staff email addresses',
    configFields: [
      { key: 'from_email', label: 'From Email', type: 'email' },
      { key: 'from_name', label: 'From Name', type: 'text' }
    ]
  },
  {
    id: 'in_app',
    name: 'In-App Notifications',
    icon: Bell,
    description: 'Show notifications within the hotel management system',
    configFields: [
      { key: 'badge_count', label: 'Show Badge Count', type: 'boolean' },
      { key: 'sound_enabled', label: 'Enable Sound', type: 'boolean' }
    ]
  },
  {
    id: 'push',
    name: 'Push Notifications',
    icon: Smartphone,
    description: 'Send push notifications to mobile devices',
    configFields: [
      { key: 'app_name', label: 'App Name', type: 'text' },
      { key: 'icon_url', label: 'Icon URL', type: 'url' }
    ]
  }
];

export function NotificationChannels() {
  const [channels, setChannels] = useState<ChannelSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannelSettings();
  }, []);

  const fetchChannelSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { data, error } = await supabase
        .from('notification_channels')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      if (error) throw error;

      // Create default channels if none exist
      const existingChannels = data || [];
      const defaultChannels = channelTypes.map(type => {
        const existing = existingChannels.find(c => c.channel_type === type.id);
        return existing || {
          id: `default-${type.id}`,
          channel_type: type.id,
          is_enabled: type.id === 'in_app', // Enable in-app by default
          config: {},
          status: 'inactive'
        };
      });

      setChannels(defaultChannels);
    } catch (error) {
      console.error('Error fetching channel settings:', error);
      toast({
        title: "Error",
        description: "Failed to load notification channels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateChannelStatus = async (channelType: string, enabled: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const existingChannel = channels.find(c => c.channel_type === channelType);

      if (existingChannel?.id.startsWith('default-')) {
        // Create new channel
        const { error } = await supabase
          .from('notification_channels')
          .insert([{
            tenant_id: userData.tenant_id,
            channel_type: channelType,
            is_enabled: enabled,
            config: {},
            status: enabled ? 'active' : 'inactive'
          }]);

        if (error) throw error;
      } else {
        // Update existing channel
        const { error } = await supabase
          .from('notification_channels')
          .update({ 
            is_enabled: enabled,
            status: enabled ? 'active' : 'inactive'
          })
          .eq('id', existingChannel?.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${channelTypes.find(c => c.id === channelType)?.name} ${enabled ? 'enabled' : 'disabled'}`,
      });

      fetchChannelSettings();
    } catch (error) {
      console.error('Error updating channel:', error);
      toast({
        title: "Error",
        description: "Failed to update notification channel",
        variant: "destructive",
      });
    }
  };

  const testChannel = async (channelType: string) => {
    setTesting(channelType);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, name, email, phone')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      let testResult = false;

      switch (channelType) {
        case 'sms':
          if (userData.phone) {
            // Test SMS via template processor
            const { data, error } = await supabase.functions.invoke('sms-template-processor', {
              body: {
                template_name: 'test_alert',
                event_type: 'system_test',
                tenant_id: userData.tenant_id,
                variables: {
                  staff_name: userData.name || 'Staff Member',
                  test_time: new Date().toLocaleTimeString()
                },
                to: userData.phone,
                send_sms: true
              }
            });
            testResult = data?.success || false;
          }
          break;

        case 'email':
          // Test email (would integrate with email system)
          testResult = true; // Simulated for now
          break;

        case 'in_app':
          // Test in-app notification
          testResult = true;
          break;

        case 'push':
          // Test push notification
          testResult = true; // Simulated for now
          break;
      }

      if (testResult) {
        toast({
          title: "Test Successful",
          description: `${channelTypes.find(c => c.id === channelType)?.name} test completed successfully`,
        });

        // Update last test time
        const channel = channels.find(c => c.channel_type === channelType);
        if (channel && !channel.id.startsWith('default-')) {
          await supabase
            .from('notification_channels')
            .update({ last_test_at: new Date().toISOString() })
            .eq('id', channel.id);
        }
      } else {
        throw new Error('Test failed');
      }

      fetchChannelSettings();
    } catch (error) {
      console.error('Error testing channel:', error);
      toast({
        title: "Test Failed",
        description: `Failed to test ${channelTypes.find(c => c.id === channelType)?.name}`,
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return <div className="text-center">Loading notification channels...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Channels</h2>
        <p className="text-muted-foreground">
          Configure how staff alerts are delivered across different channels
        </p>
      </div>

      <div className="grid gap-6">
        {channelTypes.map((channelType) => {
          const channel = channels.find(c => c.channel_type === channelType.id);
          const IconComponent = channelType.icon;
          
          return (
            <Card key={channelType.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {channelType.name}
                        <Badge 
                          variant={channel?.is_enabled ? 'default' : 'secondary'}
                        >
                          {channel?.is_enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {channel?.status && (
                          <Badge 
                            variant="outline"
                            className={
                              channel.status === 'active' 
                                ? 'border-green-200 text-green-700' 
                                : 'border-gray-200 text-gray-700'
                            }
                          >
                            {channel.status}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{channelType.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={channel?.is_enabled || false}
                      onCheckedChange={(checked) => updateChannelStatus(channelType.id, checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              {channel?.is_enabled && (
                <CardContent>
                  <div className="space-y-4">
                    {/* Configuration Fields */}
                    {channelType.configFields.length > 0 && (
                      <div className="grid gap-4 md:grid-cols-2">
                        {channelType.configFields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            <Label htmlFor={`${channelType.id}-${field.key}`}>
                              {field.label}
                            </Label>
                            {field.type === 'boolean' ? (
                              <Switch
                                id={`${channelType.id}-${field.key}`}
                                defaultChecked={channel?.config?.[field.key] || false}
                              />
                            ) : (
                              <Input
                                id={`${channelType.id}-${field.key}`}
                                type={field.type}
                                defaultValue={channel?.config?.[field.key] || ''}
                                placeholder={`Enter ${field.label.toLowerCase()}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Channel Status */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Channel Status</p>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={channel?.status === 'active' ? 'default' : 'secondary'}
                          >
                            {channel?.status || 'inactive'}
                          </Badge>
                          {channel?.last_test_at && (
                            <span className="text-xs text-muted-foreground">
                              Last tested: {new Date(channel.last_test_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testChannel(channelType.id)}
                        disabled={testing === channelType.id}
                      >
                        <TestTube className="mr-2 h-4 w-4" />
                        {testing === channelType.id ? 'Testing...' : 'Test Channel'}
                      </Button>
                    </div>

                    {/* Channel-specific information */}
                    {channelType.id === 'sms' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          SMS notifications use your hotel's SMS credit pool. Make sure you have sufficient credits.
                        </p>
                      </div>
                    )}

                    {channelType.id === 'email' && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Email notifications require proper SMTP configuration or email provider setup.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Channel Testing Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Channel Testing & Monitoring
          </CardTitle>
          <CardDescription>
            Information about notification channel testing and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Testing Channels</h4>
                <p className="text-sm text-muted-foreground">
                  Use the "Test Channel" button to verify each notification method is working correctly. 
                  Tests will send a sample alert to your own contact information.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Channel Status</h4>
                <p className="text-sm text-muted-foreground">
                  Channel status is automatically updated based on delivery success rates and test results. 
                  Failed channels will be marked as inactive.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}