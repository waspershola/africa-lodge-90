import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, MessageSquare, Clock, Phone, Shield } from "lucide-react";

interface NotificationPreferences {
  service_request: { staff_sms: boolean; guest_email: boolean };
  payment_received: { guest_sms: boolean };
  payment_reminder: { guest_sms: boolean };
  booking_confirmed: { guest_sms: boolean; manager_email: boolean };
  checkout_reminder: { guest_email: boolean };
  outstanding_payment: { guest_sms: boolean };
  reservation_created: { guest_sms: boolean; front_desk_sms: boolean };
  housekeeping_request: { staff_sms: boolean };
  pre_arrival_reminder: { guest_email: boolean };
  subscription_renewal: { admin_sms_email: boolean };
}

export function HotelSMSSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [frontDeskPhone, setFrontDeskPhone] = useState('');
  const [customFooter, setCustomFooter] = useState('');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      const { data: settings, error } = await supabase
        .from('hotel_settings')
        .select('notification_preferences, front_desk_phone, timezone')
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (settings) {
        try {
          setPreferences((settings.notification_preferences as unknown) as NotificationPreferences || null);
        } catch {
          setPreferences(null);
        }
        setFrontDeskPhone(settings.front_desk_phone || '');
        setTimezone(settings.timezone || 'Africa/Lagos');
      } else {
        // Set default preferences if no settings exist
        setPreferences({
          service_request: { staff_sms: true, guest_email: true },
          payment_received: { guest_sms: true },
          payment_reminder: { guest_sms: true },
          booking_confirmed: { guest_sms: true, manager_email: true },
          checkout_reminder: { guest_email: true },
          outstanding_payment: { guest_sms: true },
          reservation_created: { guest_sms: true, front_desk_sms: true },
          housekeeping_request: { staff_sms: true },
          pre_arrival_reminder: { guest_email: true },
          subscription_renewal: { admin_sms_email: true }
        });
      }
    } catch (error) {
      console.error('Error fetching SMS settings:', error);
      toast.error("Failed to load SMS settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { error } = await supabase
        .from('hotel_settings')
        .upsert({
          tenant_id: userData.tenant_id,
          notification_preferences: preferences as any,
          front_desk_phone: frontDeskPhone,
          timezone: timezone
        }, {
          onConflict: 'tenant_id'
        });

      if (error) throw error;

      toast.success("SMS settings saved successfully");
    } catch (error) {
      console.error('Error saving SMS settings:', error);
      toast.error("Failed to save SMS settings");
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (eventType: keyof NotificationPreferences, channel: string, enabled: boolean) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [eventType]: {
        ...preferences[eventType],
        [channel]: enabled
      }
    });
  };

  if (loading) {
    return <div className="text-center">Loading SMS settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Settings</h2>
          <p className="text-muted-foreground">
            Configure SMS notifications and communication preferences
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Basic Configuration
          </CardTitle>
          <CardDescription>
            Configure basic SMS communication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frontDeskPhone">Front Desk Phone</Label>
              <Input
                id="frontDeskPhone"
                type="tel"
                placeholder="+234 xxx xxx xxxx"
                value={frontDeskPhone}
                onChange={(e) => setFrontDeskPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Phone number for staff notifications and two-way messaging
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">Nigeria (WAT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                  <SelectItem value="America/New_York">New York (EST/EDT)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Used for scheduling SMS notifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Control when and how SMS notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {preferences && Object.entries(preferences).map(([eventType, channels]) => (
              <div key={eventType} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium capitalize">
                      {eventType.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {getEventDescription(eventType as keyof NotificationPreferences)}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {Object.values(channels).filter(Boolean).length} / {Object.keys(channels).length} active
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(channels).map(([channel, enabled]) => (
                    <div key={channel} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getChannelIcon(channel)}
                        <Label htmlFor={`${eventType}_${channel}`} className="text-sm">
                          {formatChannelName(channel)}
                        </Label>
                      </div>
                      <Switch
                        id={`${eventType}_${channel}`}
                        checked={enabled as boolean}
                        onCheckedChange={(checked) => 
                          updatePreference(eventType as keyof NotificationPreferences, channel, checked)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Message Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Message Customization
          </CardTitle>
          <CardDescription>
            Customize SMS message appearance and branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customFooter">Custom Message Footer</Label>
            <Textarea
              id="customFooter"
              placeholder="e.g., 'Thank you for choosing Hotel Name. Reply STOP to opt out.'"
              value={customFooter}
              onChange={(e) => setCustomFooter(e.target.value)}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground">
              Added to the end of all SMS messages. Keep it short to avoid extra charges.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security & Compliance
          </CardTitle>
          <CardDescription>
            SMS security and regulatory compliance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Compliance Information</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• SMS notifications comply with Nigeria Communications Commission (NCC) regulations</li>
              <li>• Guest phone numbers are stored securely and used only for hotel communications</li>
              <li>• Guests can opt out by replying "STOP" to any message</li>
              <li>• International SMS may incur additional charges</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getEventDescription(eventType: keyof NotificationPreferences): string {
  const descriptions = {
    service_request: "When guests submit service requests via QR codes",
    payment_received: "When payments are successfully processed",
    payment_reminder: "Automated reminders for outstanding payments",
    booking_confirmed: "When new reservations are confirmed",
    checkout_reminder: "Reminders sent before checkout time",
    outstanding_payment: "Notifications about unpaid balances",
    reservation_created: "When new reservations are made",
    housekeeping_request: "When housekeeping tasks are assigned",
    pre_arrival_reminder: "Day-before-arrival notifications",
    subscription_renewal: "System subscription renewals"
  };
  return descriptions[eventType] || "";
}

function getChannelIcon(channel: string) {
  switch (true) {
    case channel.includes('sms'):
      return <MessageSquare className="w-4 h-4" />;
    case channel.includes('email'):
      return <MessageSquare className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
  }
}

function formatChannelName(channel: string): string {
  return channel
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}