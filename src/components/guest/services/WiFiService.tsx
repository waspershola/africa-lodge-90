import React, { useState } from 'react';
import { Wifi, Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WiFiServiceProps {
  qrToken: string;
  sessionToken: string;
  hotelName: string;
}

export default function WiFiService({ qrToken, sessionToken, hotelName }: WiFiServiceProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);

  // Default WiFi credentials (hotels usually have these)
  const wifiCredentials = {
    ssid: `${hotelName.replace(/\s+/g, '')}_Guest`,
    password: 'Welcome2024!'
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const requestSupport = async () => {
    if (requesting) return;
    
    setRequesting(true);
    try {
      const response = await fetch(`https://dxisnnjsbuuiunjmzzqj.supabase.co/functions/v1/qr-guest-portal/guest/qr/${qrToken}/wifi-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guest_session_id: sessionToken,
          message: 'Guest requested WiFi support',
          priority: 2
        })
      });

      if (response.ok) {
        setRequested(true);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (error) {
      console.error('Error requesting WiFi support:', error);
      alert('Failed to request support. Please try again or contact the front desk.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            WiFi Credentials
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Network Name</p>
                <p className="font-mono font-medium">{wifiCredentials.ssid}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(wifiCredentials.ssid, 'ssid')}
              >
                {copied === 'ssid' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Password</p>
                <p className="font-mono font-medium">{wifiCredentials.password}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(wifiCredentials.password, 'password')}
              >
                {copied === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              Connect to the network and enter the password when prompted. If you experience any issues, request support below.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          {requested ? (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Support request submitted! Our IT team will assist you shortly.
              </AlertDescription>
            </Alert>
          ) : (
            <Button 
              onClick={requestSupport}
              disabled={requesting}
              className="w-full"
            >
              {requesting ? 'Requesting Support...' : 'Request WiFi Support'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}