import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Bell, Smartphone, Settings, TestTube } from "lucide-react";

interface ChannelSettings {
  id: string;
  channel_type: string;
  is_enabled: boolean;
  config: any;
  status: string;
  last_test_at?: string;
}

const availableChannels = [
  {
    id: 'sms',
    name: 'SMS Notifications',
    icon: MessageSquare,
    description: 'Send SMS alerts to staff mobile phones'
  },
  {
    id: 'email',
    name: 'Email Notifications', 
    icon: Mail,
    description: 'Send email alerts to staff email addresses'
  },
  {
    id: 'in_app',
    name: 'In-App Notifications',
    icon: Bell,
    description: 'Show notifications within the hotel management system'
  },
  {
    id: 'push',
    name: 'Push Notifications',
    icon: Smartphone,
    description: 'Send push notifications to mobile devices'
  }
];

export function NotificationChannels() {
  const [channels, setChannels] = useState<ChannelSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
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

      // Initialize default channels if none exist
      if (!data || data.length === 0) {
        const defaultChannels = availableChannels.map(channel => ({
          id: `default-${channel.id}`,
          channel_type: channel.id,
          is_enabled: channel.id === 'in_app', // Enable in-app by default
          config: {},
          status: 'inactive'
        }));
        setChannels(defaultChannels);
      } else {
        // Merge with available channels to ensure all are represented
        const mergedChannels = availableChannels.map(channel => {
          const existing = data.find((c: any) => c.channel_type === channel.id);
          return existing || {
            id: `default-${channel.id}`,
            channel_type: channel.id,
            is_enabled: false,
            config: {},
            status: 'inactive'
          };
        });
        setChannels(mergedChannels);
      }
    } catch (error) {
      console.error('Error fetching notification channels:', error);
      toast({
        title: "Error",
        description: "Failed to load notification channels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = async (channelId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const channel = channels.find(c => c.channel_type === channelId);
      if (!channel) return;

      const newStatus = !channel.is_enabled;

      if (channel.id.startsWith('default-')) {
        // Create new channel
        const { error } = await supabase
          .from('notification_channels')
          .insert([{
            tenant_id: userData.tenant_id,
            channel_type: channelId,
            is_enabled: newStatus,
            config: {},
            status: newStatus ? 'active' : 'inactive'
          }]);

        if (error) throw error;
      } else {
        // Update existing channel
        const { error } = await supabase
          .from('notification_channels')
          .update({ 
            is_enabled: newStatus,
            status: newStatus ? 'active' : 'inactive'
          })
          .eq('id', channel.id);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${availableChannels.find(c => c.id === channelId)?.name} ${newStatus ? 'enabled' : 'disabled'}`,
      });

      fetchChannels();
    } catch (error) {
      console.error('Error updating channel:', error);
      toast({
        title: "Error",
        description: "Failed to update notification channel",
        variant: "destructive",
      });
    }
  };

  const testChannel = async (channelId: string) => {
    setTesting(channelId);
    try {
      const channel = channels.find(c => c.channel_type === channelId);
      if (!channel || !channel.is_enabled) {
        toast({
          title: "Test Failed",
          description: "Channel must be enabled before testing",
          variant: "destructive",
        });
        return;
      }

      // Test channel by sending a test notification event
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id, name, email, phone')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Create a test notification event
      const { error: eventError } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: userData.tenant_id,
          event_type: 'channel_test',
          event_source: 'system',
          priority: 'low',
          channels: [channelId],
          template_data: {
            staff_name: userData.name || 'Staff Member',
            test_time: new Date().toLocaleTimeString(),
            guest_phone: userData.phone,
            guest_email: userData.email
          },
          recipients: [{ type: 'staff', id: user.id }]
        });

      if (eventError) throw eventError;

      // Process the notification immediately
      const { data: processResult } = await supabase.functions.invoke('notification-queue-processor');
      
      toast({
        title: "Test Initiated",
        description: `Test notification sent via ${availableChannels.find(c => c.id === channelId)?.name}`,
      });

      // Update last test timestamp
      if (!channel.id.startsWith('default-')) {
        await supabase
          .from('notification_channels')
          .update({ last_test_at: new Date().toISOString() })
          .eq('id', channel.id);
      }

      fetchChannels();
    } catch (error) {
      console.error('Error testing channel:', error);
      toast({
        title: "Test Failed",
        description: `Failed to test ${availableChannels.find(c => c.id === channelId)?.name}`,
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
        {availableChannels.map((channelType) => {
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
                      onCheckedChange={(checked) => toggleChannel(channelType.id)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              {channel?.is_enabled && (
                <CardContent>
                  <div className="space-y-4">
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