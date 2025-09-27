import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Smartphone, Globe, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SMSProvider {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  config: {
    api_key?: string;
    sender_id?: string;
    base_url?: string;
  };
  features: string[];
  pricing: {
    local: number;
    international: number;
  };
  status: 'active' | 'inactive' | 'error';
}

export const SMSProviderConfig: React.FC = () => {
  const [providers, setProviders] = useState<SMSProvider[]>([
    {
      id: 'termii',
      name: 'Termii',
      description: 'Primary SMS provider for African markets',
      enabled: true,
      priority: 1,
      config: {
        api_key: '',
        sender_id: 'HotelPMS'
      },
      features: ['SMS', 'WhatsApp', 'Voice', 'Verification'],
      pricing: { local: 2.5, international: 15 },
      status: 'active'
    },
    {
      id: 'africastalking',
      name: 'Africa\'s Talking',
      description: 'Secondary provider for backup and failover',
      enabled: false,
      priority: 2,
      config: {
        api_key: '',
        sender_id: 'HotelPMS'
      },
      features: ['SMS', 'Voice', 'USSD', 'Airtime'],
      pricing: { local: 3.0, international: 18 },
      status: 'inactive'
    },
    {
      id: 'twilio',
      name: 'Twilio',
      description: 'Global SMS provider for international guests',
      enabled: false,
      priority: 3,
      config: {
        api_key: '',
        sender_id: 'Hotel'
      },
      features: ['SMS', 'WhatsApp', 'Voice', 'Video'],
      pricing: { local: 8.0, international: 25 },
      status: 'inactive'
    }
  ]);

  const { toast } = useToast();

  const toggleProvider = (id: string) => {
    setProviders(prev => 
      prev.map(provider => 
        provider.id === id 
          ? { ...provider, enabled: !provider.enabled }
          : provider
      )
    );

    toast({
      title: "SMS Provider Updated",
      description: "Provider settings have been saved."
    });
  };

  const updateProviderConfig = (id: string, config: any) => {
    setProviders(prev => 
      prev.map(provider => 
        provider.id === id 
          ? { ...provider, config: { ...provider.config, ...config } }
          : provider
      )
    );
  };

  const testProvider = async (id: string) => {
    // Simulate testing SMS provider
    toast({
      title: "Testing SMS Provider",
      description: "Sending test message..."
    });

    // In real implementation, this would call the edge function
    setTimeout(() => {
      toast({
        title: "Test Successful",
        description: "SMS provider is working correctly."
      });
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* SMS Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.filter(p => p.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {providers.length} configured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Provider</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.find(p => p.priority === 1)?.name || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Cost</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦2.5</div>
            <p className="text-xs text-muted-foreground">per local SMS</p>
          </CardContent>
        </Card>
      </div>

      {/* SMS Providers Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Providers Configuration</CardTitle>
          <CardDescription>
            Configure SMS providers for guest notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {providers.map((provider) => (
              <div key={provider.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {provider.name}
                        {getStatusIcon(provider.status)}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusColor(provider.status)}>
                      {provider.status.toUpperCase()}
                    </Badge>
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={() => toggleProvider(provider.id)}
                    />
                  </div>
                </div>

                {provider.enabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${provider.id}-api-key`}>API Key</Label>
                        <Input
                          id={`${provider.id}-api-key`}
                          type="password"
                          placeholder="Enter API key"
                          value={provider.config.api_key || ''}
                          onChange={(e) => updateProviderConfig(provider.id, { api_key: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${provider.id}-sender-id`}>Sender ID</Label>
                        <Input
                          id={`${provider.id}-sender-id`}
                          placeholder="e.g., HotelPMS"
                          value={provider.config.sender_id || ''}
                          onChange={(e) => updateProviderConfig(provider.id, { sender_id: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Label className="text-sm font-medium">Features:</Label>
                      {provider.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Pricing:</span>
                        <span className="ml-2">₦{provider.pricing.local} local, ₦{provider.pricing.international} international</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testProvider(provider.id)}
                      >
                        Test Provider
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};