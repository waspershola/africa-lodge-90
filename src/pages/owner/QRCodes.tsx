import React, { useState } from 'react';
import { QrCode, Download, Eye, Settings, Wifi, UtensilsCrossed, MessageSquare, Menu } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function QRCodesPage() {
  const [selectedService, setSelectedService] = useState('wifi');
  const [qrSettings, setQrSettings] = useState({
    size: '256',
    format: 'png',
    includeLogo: true,
    includeHotelName: true
  });

  const services = [
    {
      id: 'wifi',
      name: 'Guest Wi-Fi',
      icon: Wifi,
      description: 'Generate QR codes for instant Wi-Fi access',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'room-service',
      name: 'Room Service',
      icon: UtensilsCrossed,
      description: 'QR codes for room service ordering',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'feedback',
      name: 'Feedback Form',
      icon: MessageSquare,
      description: 'Collect guest feedback and reviews',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'menu',
      name: 'Digital Menu',
      icon: Menu,
      description: 'Restaurant and bar menu access',
      color: 'bg-orange-100 text-orange-700'
    }
  ];

  const qrSizes = [
    { value: '128', label: '128x128px (Small)' },
    { value: '256', label: '256x256px (Medium)' },
    { value: '512', label: '512x512px (Large)' },
    { value: '1024', label: '1024x1024px (Print Quality)' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">QR Code Generator</h1>
        <p className="text-muted-foreground">
          Create branded QR codes for your hotel services
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Services
              </CardTitle>
              <CardDescription>
                Select a service to generate QR codes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.map((service) => {
                const IconComponent = service.icon;
                return (
                  <div
                    key={service.id}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedService === service.id
                        ? 'border-primary bg-primary/5'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedService(service.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${service.color}`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {service.description}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                QR Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Size</Label>
                <Select value={qrSettings.size} onValueChange={(value) => 
                  setQrSettings(prev => ({ ...prev, size: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qrSizes.map(size => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={qrSettings.format} onValueChange={(value) => 
                  setQrSettings(prev => ({ ...prev, format: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-logo">Include Hotel Logo</Label>
                  <Switch 
                    id="include-logo"
                    checked={qrSettings.includeLogo}
                    onCheckedChange={(checked) => 
                      setQrSettings(prev => ({ ...prev, includeLogo: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-name">Include Hotel Name</Label>
                  <Switch 
                    id="include-name"
                    checked={qrSettings.includeHotelName}
                    onCheckedChange={(checked) => 
                      setQrSettings(prev => ({ ...prev, includeHotelName: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs value={selectedService} onValueChange={setSelectedService}>
            <TabsList className="grid w-full grid-cols-4">
              {services.map(service => (
                <TabsTrigger key={service.id} value={service.id}>
                  {service.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="wifi" className="space-y-4">
              <WiFiQRGenerator qrSettings={qrSettings} />
            </TabsContent>

            <TabsContent value="room-service" className="space-y-4">
              <RoomServiceQRGenerator qrSettings={qrSettings} />
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <FeedbackQRGenerator qrSettings={qrSettings} />
            </TabsContent>

            <TabsContent value="menu" className="space-y-4">
              <MenuQRGenerator qrSettings={qrSettings} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function WiFiQRGenerator({ qrSettings }: { qrSettings: any }) {
  const [wifiConfig, setWifiConfig] = useState({
    ssid: 'LagosGrandHotel_Guest',
    password: 'Welcome2024!',
    security: 'WPA',
    hidden: false
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Wi-Fi QR Code Configuration
        </CardTitle>
        <CardDescription>
          Generate QR codes for instant guest Wi-Fi access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ssid">Network Name (SSID)</Label>
            <Input 
              id="ssid"
              value={wifiConfig.ssid}
              onChange={(e) => setWifiConfig(prev => ({ ...prev, ssid: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password"
              value={wifiConfig.password}
              onChange={(e) => setWifiConfig(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Security Type</Label>
            <Select value={wifiConfig.security} onValueChange={(value) => 
              setWifiConfig(prev => ({ ...prev, security: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA/WPA2</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">Open Network</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="hidden"
              checked={wifiConfig.hidden}
              onCheckedChange={(checked) => 
                setWifiConfig(prev => ({ ...prev, hidden: checked }))
              }
            />
            <Label htmlFor="hidden">Hidden Network</Label>
          </div>
        </div>

        <QRCodePreview 
          type="wifi"
          data={wifiConfig}
          settings={qrSettings}
        />
      </CardContent>
    </Card>
  );
}

function RoomServiceQRGenerator({ qrSettings }: { qrSettings: any }) {
  const [serviceConfig, setServiceConfig] = useState({
    baseUrl: 'https://lagoshotel.com/room-service',
    defaultRoom: '',
    includeInstructions: true,
    customMessage: 'Scan to order room service directly to your room'
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5" />
          Room Service QR Configuration
        </CardTitle>
        <CardDescription>
          Generate QR codes for room service ordering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service-url">Room Service URL</Label>
            <Input 
              id="service-url"
              value={serviceConfig.baseUrl}
              onChange={(e) => setServiceConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message</Label>
            <Textarea 
              id="custom-message"
              value={serviceConfig.customMessage}
              onChange={(e) => setServiceConfig(prev => ({ ...prev, customMessage: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="include-instructions"
              checked={serviceConfig.includeInstructions}
              onCheckedChange={(checked) => 
                setServiceConfig(prev => ({ ...prev, includeInstructions: checked }))
              }
            />
            <Label htmlFor="include-instructions">Include Usage Instructions</Label>
          </div>
        </div>

        <QRCodePreview 
          type="room-service"
          data={serviceConfig}
          settings={qrSettings}
        />
      </CardContent>
    </Card>
  );
}

function FeedbackQRGenerator({ qrSettings }: { qrSettings: any }) {
  const [feedbackConfig, setFeedbackConfig] = useState({
    formUrl: 'https://lagoshotel.com/feedback',
    title: 'Share Your Experience',
    incentive: 'Get 10% off your next stay!',
    collectEmail: true
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Feedback QR Configuration
        </CardTitle>
        <CardDescription>
          Generate QR codes for guest feedback collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-url">Feedback Form URL</Label>
            <Input 
              id="feedback-url"
              value={feedbackConfig.formUrl}
              onChange={(e) => setFeedbackConfig(prev => ({ ...prev, formUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-title">Call to Action</Label>
            <Input 
              id="feedback-title"
              value={feedbackConfig.title}
              onChange={(e) => setFeedbackConfig(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incentive">Incentive Message</Label>
            <Input 
              id="incentive"
              value={feedbackConfig.incentive}
              onChange={(e) => setFeedbackConfig(prev => ({ ...prev, incentive: e.target.value }))}
            />
          </div>
        </div>

        <QRCodePreview 
          type="feedback"
          data={feedbackConfig}
          settings={qrSettings}
        />
      </CardContent>
    </Card>
  );
}

function MenuQRGenerator({ qrSettings }: { qrSettings: any }) {
  const [menuConfig, setMenuConfig] = useState({
    menuUrl: 'https://lagoshotel.com/menu',
    menuType: 'restaurant',
    language: 'en',
    showPrices: true
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Menu className="h-5 w-5" />
          Digital Menu QR Configuration
        </CardTitle>
        <CardDescription>
          Generate QR codes for digital menu access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="menu-url">Menu URL</Label>
            <Input 
              id="menu-url"
              value={menuConfig.menuUrl}
              onChange={(e) => setMenuConfig(prev => ({ ...prev, menuUrl: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Menu Type</Label>
            <Select value={menuConfig.menuType} onValueChange={(value) => 
              setMenuConfig(prev => ({ ...prev, menuType: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="bar">Bar & Lounge</SelectItem>
                <SelectItem value="room-service">Room Service</SelectItem>
                <SelectItem value="spa">Spa Services</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={menuConfig.language} onValueChange={(value) => 
              setMenuConfig(prev => ({ ...prev, language: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="show-prices"
              checked={menuConfig.showPrices}
              onCheckedChange={(checked) => 
                setMenuConfig(prev => ({ ...prev, showPrices: checked }))
              }
            />
            <Label htmlFor="show-prices">Show Prices</Label>
          </div>
        </div>

        <QRCodePreview 
          type="menu"
          data={menuConfig}
          settings={qrSettings}
        />
      </CardContent>
    </Card>
  );
}

function QRCodePreview({ type, data, settings }: { type: string; data: any; settings: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Preview & Export</span>
          <Badge variant="secondary">{settings.size}px</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code Placeholder */}
          <div 
            className="border-2 border-dashed border-muted-foreground/25 bg-muted/50 flex items-center justify-center rounded-lg"
            style={{ 
              width: Math.min(parseInt(settings.size), 200), 
              height: Math.min(parseInt(settings.size), 200) 
            }}
          >
            <div className="text-center">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">QR Code Preview</p>
            </div>
          </div>

          {settings.includeHotelName && (
            <div className="text-center">
              <h3 className="font-semibold">Lagos Grand Hotel</h3>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download {settings.format.toUpperCase()}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}