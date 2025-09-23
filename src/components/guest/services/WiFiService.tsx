import React, { useState } from 'react';
import { Wifi, Copy, Check, Crown, Sparkles } from 'lucide-react';
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

  // Default WiFi credentials
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
    <div className="space-y-6 animate-fade-in">
      {/* WiFi Credentials Card */}
      <Card className="shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200/50">
          <CardTitle className="flex items-center gap-3 text-amber-900">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <Wifi className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-serif">WiFi Credentials</h3>
              <p className="text-sm text-amber-700/70 font-normal">Complimentary high-speed internet</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Network Name */}
            <div className="relative group">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200/50 group-hover:shadow-lg transition-all duration-300">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">Network Name</p>
                  </div>
                  <p className="font-mono text-lg font-semibold text-amber-900 tracking-wide">
                    {wifiCredentials.ssid}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(wifiCredentials.ssid, 'ssid')}
                  className="ml-4 bg-white/50 hover:bg-white/80 text-amber-700 hover:text-amber-800 border border-amber-200/50 rounded-full p-3 transition-all duration-300 hover:scale-105"
                >
                  {copied === 'ssid' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied === 'ssid' && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs animate-fade-in">
                  Copied!
                </div>
              )}
            </div>
            
            {/* Password */}
            <div className="relative group">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200/50 group-hover:shadow-lg transition-all duration-300">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">Password</p>
                  </div>
                  <p className="font-mono text-lg font-semibold text-amber-900 tracking-wide">
                    {wifiCredentials.password}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(wifiCredentials.password, 'password')}
                  className="ml-4 bg-white/50 hover:bg-white/80 text-amber-700 hover:text-amber-800 border border-amber-200/50 rounded-full p-3 transition-all duration-300 hover:scale-105"
                >
                  {copied === 'password' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied === 'password' && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-xs animate-fade-in">
                  Copied!
                </div>
              )}
            </div>
          </div>

          <Alert className="border-amber-200 bg-amber-50/50 backdrop-blur-sm">
            <Wifi className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Connect to the network and enter the password when prompted. Enjoy complimentary high-speed internet throughout your stay.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card className="shadow-2xl border-amber-200/50 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100 border-b border-amber-200/50">
          <CardTitle className="text-amber-900 font-serif">Need Technical Support?</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {requested ? (
            <Alert className="border-green-200 bg-green-50/50 backdrop-blur-sm">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-lg">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  <span className="font-medium">Support Request Submitted!</span>
                </div>
                <p className="mt-1">Our IT team will assist you shortly. Please allow 5-10 minutes for response.</p>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-amber-700/80 text-lg">
                Experiencing connection issues? Our technical support team is ready to help.
              </p>
              <Button 
                onClick={requestSupport}
                disabled={requesting}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg"
              >
                {requesting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Contacting Support...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    Request Technical Support
                  </div>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}