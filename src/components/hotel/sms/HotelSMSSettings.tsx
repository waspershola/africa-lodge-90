import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, MessageSquare, Bell, Shield } from "lucide-react";

interface NotificationSetting {
  id: string;
  event_type: string;
  is_enabled: boolean;
}

const eventTypes = [
  { 
    value: 'booking_confirmation', 
    label: 'Booking Confirmation',
    description: 'Send SMS when a booking is confirmed'
  },
  { 
    value: 'check_in_reminder', 
    label: 'Check-in Reminder',
    description: 'Remind guests about their check-in time'
  },
  { 
    value: 'check_out_reminder', 
    label: 'Check-out Reminder',
    description: 'Remind guests about their check-out time'
  },
  { 
    value: 'payment_reminder', 
    label: 'Payment Reminder',
    description: 'Send payment reminders to guests'
  },
  { 
    value: 'booking_cancelled', 
    label: 'Booking Cancelled',
    description: 'Notify guests when booking is cancelled'
  },
  { 
    value: 'qr_order_confirmation', 
    label: 'QR Order Confirmation',
    description: 'Confirm QR code orders via SMS'
  },
  { 
    value: 'qr_order_ready', 
    label: 'QR Order Ready',
    description: 'Notify when QR order is ready'
  },
  { 
    value: 'maintenance_alert', 
    label: 'Maintenance Alert',
    description: 'Send maintenance notifications to staff'
  }
];

export function HotelSMSSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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
        .from('sms_notifications_settings')
        .select('*')
        .eq('tenant_id', userData.tenant_id);

      if (error) throw error;

      // Create settings for all event types, defaulting to enabled
      const allSettings = eventTypes.map(eventType => {
        const existing = data?.find(s => s.event_type === eventType.value);
        return {
          id: existing?.id || '',
          event_type: eventType.value,
          is_enabled: existing?.is_enabled ?? true
        };
      });

      setSettings(allSettings);
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (eventType: string, isEnabled: boolean) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const existingSetting = settings.find(s => s.event_type === eventType);

      if (existingSetting?.id) {
        // Update existing setting
        const { error } = await supabase
          .from('sms_notifications_settings')
          .update({ is_enabled: isEnabled })
          .eq('id', existingSetting.id);

        if (error) throw error;
      } else {
        // Create new setting
        const { error } = await supabase
          .from('sms_notifications_settings')
          .insert([{
            tenant_id: userData.tenant_id,
            event_type: eventType,
            is_enabled: isEnabled
          }]);

        if (error) throw error;
      }

      // Update local state
      setSettings(prev => prev.map(setting => 
        setting.event_type === eventType 
          ? { ...setting, is_enabled: isEnabled }
          : setting
      ));

      toast({
        title: "Success",
        description: "SMS notification setting updated",
      });
    } catch (error) {
      console.error('Error updating SMS setting:', error);
      toast({
        title: "Error",
        description: "Failed to update SMS setting",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading SMS settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">SMS Settings</h2>
        <p className="text-muted-foreground">Configure SMS notification preferences for your hotel</p>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            SMS Notifications
          </CardTitle>
          <CardDescription>
            Choose which events should trigger SMS notifications to guests and staff
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {eventTypes.map((eventType) => {
              const setting = settings.find(s => s.event_type === eventType.value);
              return (
                <div key={eventType.value} className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">
                      {eventType.label}
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      {eventType.description}
                    </div>
                  </div>
                  <Switch
                    checked={setting?.is_enabled ?? true}
                    onCheckedChange={(checked) => updateSetting(eventType.value, checked)}
                    disabled={saving}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Additional SMS configuration options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    SMS Template Management
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Customize SMS templates in the Templates tab to personalize your messages.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center">
                <Shield className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Data Privacy
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    All SMS communications comply with data protection regulations. Guest phone numbers are securely handled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">SMS Credits</h4>
              <p className="text-muted-foreground">
                Each SMS sent consumes credits from your hotel's credit pool. Monitor usage in the Credits tab.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Message Templates</h4>
              <p className="text-muted-foreground">
                SMS messages use templates that can include variables like guest name, room number, and dates. 
                Customize these in the Templates section.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Delivery Status</h4>
              <p className="text-muted-foreground">
                All SMS delivery attempts are logged and can be viewed in the History tab for troubleshooting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}