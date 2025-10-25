// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useMultiTenantAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Clock, Shield, Phone, RotateCcw } from 'lucide-react';

interface SessionSettings {
  session_lifetime_hours: number;
  allow_session_extension: boolean;
  require_phone_email: boolean;
  max_requests_per_hour: number;
  enable_session_resume: boolean;
}

interface SessionSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionSettingsModal({ open, onOpenChange }: SessionSettingsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SessionSettings>({
    session_lifetime_hours: 24,
    allow_session_extension: true,
    require_phone_email: false,
    max_requests_per_hour: 50,
    enable_session_resume: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && user?.tenant_id) {
      loadSettings();
    }
  }, [open, user?.tenant_id]);

  const loadSettings = async () => {
    if (!user?.tenant_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('qr_session_settings')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          session_lifetime_hours: data.session_lifetime_hours,
          allow_session_extension: data.allow_session_extension,
          require_phone_email: data.require_phone_email,
          max_requests_per_hour: data.max_requests_per_hour,
          enable_session_resume: data.enable_session_resume
        });
      }
    } catch (error) {
      console.error('Error loading session settings:', error);
      toast({
        title: "Error",
        description: "Failed to load session settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user?.tenant_id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('qr_session_settings')
        .upsert({
          tenant_id: user.tenant_id,
          ...settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "QR session settings have been updated successfully"
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving session settings:', error);
      toast({
        title: "Error",
        description: "Failed to save session settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const lifetimeOptions = [
    { value: 12, label: '12 hours' },
    { value: 24, label: '24 hours' },
    { value: 48, label: '48 hours' },
    { value: 72, label: '72 hours' }
  ];

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] w-[95vw] sm:w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guest Session Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Session Duration
              </CardTitle>
              <CardDescription>
                Control how long guest sessions remain active
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="session_lifetime">Default Session Lifetime</Label>
                <Select 
                  value={settings.session_lifetime_hours.toString()} 
                  onValueChange={(value) => setSettings(prev => ({ 
                    ...prev, 
                    session_lifetime_hours: parseInt(value) 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lifetimeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_extension">Allow Session Extension</Label>
                  <p className="text-sm text-muted-foreground">
                    Let guests extend their session before it expires
                  </p>
                </div>
                <Switch
                  id="allow_extension"
                  checked={settings.allow_session_extension}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    allow_session_extension: checked 
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Limits
              </CardTitle>
              <CardDescription>
                Configure security settings and rate limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_requests">Maximum Requests Per Hour</Label>
                <Input
                  id="max_requests"
                  type="number"
                  min="1"
                  max="200"
                  value={settings.max_requests_per_hour}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    max_requests_per_hour: parseInt(e.target.value) || 50 
                  }))}
                />
                <p className="text-sm text-muted-foreground">
                  Prevent abuse by limiting requests per session
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Guest Information
              </CardTitle>
              <CardDescription>
                Configure guest data collection requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="require_contact">Require Phone or Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Require guests to provide contact info for extended sessions
                  </p>
                </div>
                <Switch
                  id="require_contact"
                  checked={settings.require_phone_email}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    require_phone_email: checked 
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Session Recovery
              </CardTitle>
              <CardDescription>
                Allow guests to resume their sessions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable_resume">Enable Session Resume</Label>
                  <p className="text-sm text-muted-foreground">
                    Let guests resume sessions via SMS/Email links
                  </p>
                </div>
                <Switch
                  id="enable_resume"
                  checked={settings.enable_session_resume}
                  onCheckedChange={(checked) => setSettings(prev => ({ 
                    ...prev, 
                    enable_session_resume: checked 
                  }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}