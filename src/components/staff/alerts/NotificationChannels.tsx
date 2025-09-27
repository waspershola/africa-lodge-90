import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail, Bell, Smartphone, Settings, TestTube } from "lucide-react";

interface ChannelSettings {
  id: string;
  channel_type: string;
  is_enabled: boolean;
  config: any;
  status: string;
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
  const [loading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      // TODO: Enable after migration is approved
      const defaultChannels = availableChannels.map(channel => ({
        id: channel.id,
        channel_type: channel.id,
        is_enabled: false,
        config: {},
        status: 'inactive'
      }));
      setChannels(defaultChannels);
    } catch (error) {
      console.error('Error fetching notification channels:', error);
      toast({
        title: "Error",
        description: "Failed to load notification channels",
        variant: "destructive",
      });
    }
  };

  const toggleChannel = async (channelId: string) => {
    // TODO: Enable after migration is approved
    toast({ title: "Info", description: "Database migration pending approval" });
  };

  const testChannel = async (channelId: string) => {
    // TODO: Enable after migration is approved
    toast({ title: "Info", description: "Test functionality pending migration approval" });
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