import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Volume2, VolumeX, Play, Settings } from 'lucide-react';
import { audioNotificationService, type AudioPreferences } from '@/services/AudioNotificationService';

export function AudioControlPanel() {
  const [preferences, setPreferences] = useState<AudioPreferences>(audioNotificationService.getPreferences());
  const [isTestingSound, setIsTestingSound] = useState(false);

  const handlePreferenceChange = (type: keyof AudioPreferences, field: string, value: any) => {
    const updated = {
      ...preferences,
      [type]: { ...preferences[type], [field]: value }
    };
    setPreferences(updated);
    audioNotificationService.updatePreferences(updated);
  };

  const testSound = async (type: keyof AudioPreferences) => {
    setIsTestingSound(true);
    await audioNotificationService.testSound(type);
    setTimeout(() => setIsTestingSound(false), 1000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Audio & Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(preferences).map(([type, prefs]) => (
          <div key={type} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{type.replace('_', ' ').toUpperCase()}</Badge>
                <Switch
                  checked={prefs.enabled}
                  onCheckedChange={(checked) => handlePreferenceChange(type as keyof AudioPreferences, 'enabled', checked)}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isTestingSound || !prefs.enabled}
                onClick={() => testSound(type as keyof AudioPreferences)}
              >
                <Play className="h-3 w-3 mr-1" />
                Test
              </Button>
            </div>
            
            {prefs.enabled && (
              <div className="flex items-center gap-4">
                <VolumeX className="h-4 w-4" />
                <Slider
                  value={[prefs.volume * 100]}
                  onValueChange={([value]) => handlePreferenceChange(type as keyof AudioPreferences, 'volume', value / 100)}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4" />
                <span className="text-sm w-8">{Math.round(prefs.volume * 100)}%</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}