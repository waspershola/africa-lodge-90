import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Wifi,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { QRSession, HotelConfig } from '@/hooks/useQRSession';

interface WifiFlowProps {
  session: QRSession;
  hotelConfig: HotelConfig;
  onBack: () => void;
}

export const WifiFlow = ({ session, hotelConfig, onBack }: WifiFlowProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'ssid' | 'password' | null>(null);

  const copyToClipboard = async (text: string, field: 'ssid' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const connectionSteps = [
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: 'Open Wi-Fi Settings',
      description: 'Go to Settings → Wi-Fi on your device'
    },
    {
      icon: <Wifi className="h-5 w-5" />,
      title: 'Select Network',
      description: `Look for "${hotelConfig.wifi_ssid}" in available networks`
    },
    {
      icon: <Eye className="h-5 w-5" />,
      title: 'Enter Password',
      description: 'Use the password shown below when prompted'
    },
    {
      icon: <CheckCircle className="h-5 w-5" />,
      title: 'Connect',
      description: 'Your device should connect automatically'
    }
  ];

  const deviceTypes = [
    { icon: <Smartphone className="h-6 w-6" />, name: 'Phone', count: '5 devices' },
    { icon: <Tablet className="h-6 w-6" />, name: 'Tablet', count: '2 devices' },
    { icon: <Monitor className="h-6 w-6" />, name: 'Laptop', count: '3 devices' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="font-semibold">Wi-Fi Access</h1>
            <div></div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Connection Status */}
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">Wi-Fi Available</h3>
                <p className="text-sm text-green-700">
                  Room {session.room_id} - {hotelConfig.name}
                </p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                Free
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Network Credentials */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Network Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Network Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Network Name (SSID)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg">
                  {hotelConfig.wifi_ssid}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(hotelConfig.wifi_ssid || '', 'ssid')}
                  className="px-3"
                >
                  {copiedField === 'ssid' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Password
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg">
                  {showPassword ? hotelConfig.wifi_password : '••••••••••••'}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(hotelConfig.wifi_password || '', 'password')}
                  className="px-3"
                >
                  {copiedField === 'password' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>How to Connect</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connectionSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-medium text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {step.icon}
                      <h4 className="font-medium">{step.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Limit Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Connection Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Maximum devices per room</span>
                <Badge variant="secondary">10 devices</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection speed</span>
                <Badge variant="secondary">High Speed</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Session duration</span>
                <Badge variant="secondary">24 hours</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Types */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Compatible Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {deviceTypes.map((device, index) => (
                <div key={index} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="h-10 w-10 mx-auto mb-2 rounded-lg bg-background flex items-center justify-center">
                    {device.icon}
                  </div>
                  <p className="text-sm font-medium">{device.name}</p>
                  <p className="text-xs text-muted-foreground">{device.count}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Need Help?</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Having trouble connecting? Our front desk team is here to help.
                </p>
                <div className="text-sm text-blue-700">
                  <p><strong>Call:</strong> Dial 0 from your room phone</p>
                  <p><strong>Hours:</strong> 24/7 technical support</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By connecting to our Wi-Fi, you agree to our acceptable use policy.
            Internet usage is monitored for security purposes.
          </p>
        </div>
      </div>
    </div>
  );
};