import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  AlertTriangle, 
  Shield, 
  Zap, 
  Smartphone, 
  CreditCard,
  Mail,
  MessageSquare,
  Key,
  Database,
  Server,
  Globe,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToggleEmergencyMode } from '@/hooks/useApi';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Advanced() {
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [systemConfigs, setSystemConfigs] = useState({
    betaFeatures: false,
    maintenanceMode: false,
    debugMode: false,
    newUIRollout: false,
    apiRateLimit: 1000,
    maxUploadSize: 50
  });

  const [integrations, setIntegrations] = useState({
    twilioApiKey: '',
    twilioAuthToken: '',
    sendgridApiKey: '',
    paystack: {
      publicKey: '',
      secretKey: ''
    },
    flutterwave: {
      publicKey: '',
      secretKey: ''
    },
    slack: {
      webhookUrl: ''
    }
  });

  const toggleEmergencyMode = useToggleEmergencyMode();

  const handleEmergencyToggle = () => {
    toggleEmergencyMode.mutate(!emergencyMode);
    setEmergencyMode(!emergencyMode);
  };

  const handleConfigChange = (key: string, value: boolean | number) => {
    setSystemConfigs(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleIntegrationChange = (provider: string, key: string, value: string) => {
    if (typeof integrations[provider as keyof typeof integrations] === 'object') {
      setIntegrations(prev => ({
        ...prev,
        [provider]: {
          ...(prev[provider as keyof typeof integrations] as object),
          [key]: value
        }
      }));
    } else {
      setIntegrations(prev => ({
        ...prev,
        [provider]: value
      }));
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={staggerChildren}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <motion.div variants={fadeIn}>
        <h1 className="text-2xl font-bold display-heading text-gradient mb-1">Advanced Tools</h1>
        <p className="text-muted-foreground">System configuration and integration management</p>
      </motion.div>

      {/* Emergency Mode Alert */}
      {emergencyMode && (
        <motion.div variants={fadeIn}>
          <Alert className="border-destructive bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>Emergency Mode Active:</strong> All tenant operations are restricted. 
              Only critical system functions are available.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="system">System Configuration</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Controls</TabsTrigger>
        </TabsList>

        {/* System Configuration */}
        <TabsContent value="system" className="space-y-6">
          <motion.div variants={fadeIn}>
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Platform Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-medium">Beta Features</p>
                          <p className="text-sm text-muted-foreground">Enable experimental features</p>
                        </div>
                      </div>
                      <Switch 
                        checked={systemConfigs.betaFeatures}
                        onCheckedChange={(checked) => handleConfigChange('betaFeatures', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">New UI Rollout</p>
                          <p className="text-sm text-muted-foreground">Enable new dashboard UI</p>
                        </div>
                      </div>
                      <Switch 
                        checked={systemConfigs.newUIRollout}
                        onCheckedChange={(checked) => handleConfigChange('newUIRollout', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-medium">Debug Mode</p>
                          <p className="text-sm text-muted-foreground">Extended logging and debugging</p>
                        </div>
                      </div>
                      <Switch 
                        checked={systemConfigs.debugMode}
                        onCheckedChange={(checked) => handleConfigChange('debugMode', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="apiRateLimit">API Rate Limit (requests/minute)</Label>
                      <Input
                        id="apiRateLimit"
                        type="number"
                        value={systemConfigs.apiRateLimit}
                        onChange={(e) => handleConfigChange('apiRateLimit', parseInt(e.target.value) || 1000)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                      <Input
                        id="maxUploadSize"
                        type="number"
                        value={systemConfigs.maxUploadSize}
                        onChange={(e) => handleConfigChange('maxUploadSize', parseInt(e.target.value) || 50)}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Server className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">Maintenance Mode</p>
                          <p className="text-sm text-muted-foreground">Disable tenant access</p>
                        </div>
                      </div>
                      <Switch 
                        checked={systemConfigs.maintenanceMode}
                        onCheckedChange={(checked) => handleConfigChange('maintenanceMode', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
                    <Settings className="h-4 w-4 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <motion.div variants={fadeIn} className="grid gap-6">
            {/* SMS Provider */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  SMS Provider (Twilio)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="twilioApiKey">API Key</Label>
                    <Input
                      id="twilioApiKey"
                      type="password"
                      value={integrations.twilioApiKey}
                      onChange={(e) => handleIntegrationChange('twilioApiKey', '', e.target.value)}
                      placeholder="Enter Twilio API Key"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="twilioAuthToken">Auth Token</Label>
                    <Input
                      id="twilioAuthToken"
                      type="password"
                      value={integrations.twilioAuthToken}
                      onChange={(e) => handleIntegrationChange('twilioAuthToken', '', e.target.value)}
                      placeholder="Enter Auth Token"
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Provider */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Provider (SendGrid)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="sendgridApiKey">SendGrid API Key</Label>
                  <Input
                    id="sendgridApiKey"
                    type="password"
                    value={integrations.sendgridApiKey}
                    onChange={(e) => handleIntegrationChange('sendgridApiKey', '', e.target.value)}
                    placeholder="Enter SendGrid API Key"
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Gateways */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payment Gateways
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-600"></div>
                    Paystack
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Public Key</Label>
                      <Input
                        type="password"
                        value={integrations.paystack.publicKey}
                        onChange={(e) => handleIntegrationChange('paystack', 'publicKey', e.target.value)}
                        placeholder="pk_live_..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Secret Key</Label>
                      <Input
                        type="password"
                        value={integrations.paystack.secretKey}
                        onChange={(e) => handleIntegrationChange('paystack', 'secretKey', e.target.value)}
                        placeholder="sk_live_..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-600"></div>
                    Flutterwave
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Public Key</Label>
                      <Input
                        type="password"
                        value={integrations.flutterwave.publicKey}
                        onChange={(e) => handleIntegrationChange('flutterwave', 'publicKey', e.target.value)}
                        placeholder="FLWPUBK_..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Secret Key</Label>
                      <Input
                        type="password"
                        value={integrations.flutterwave.secretKey}
                        onChange={(e) => handleIntegrationChange('flutterwave', 'secretKey', e.target.value)}
                        placeholder="FLWSECK_..."
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slack Integration */}
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Slack Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="slackWebhook">Webhook URL</Label>
                  <Input
                    id="slackWebhook"
                    type="url"
                    value={integrations.slack.webhookUrl}
                    onChange={(e) => handleIntegrationChange('slack', 'webhookUrl', e.target.value)}
                    placeholder="https://hooks.slack.com/services/..."
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">
                <Key className="h-4 w-4 mr-2" />
                Save Integration Settings
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Emergency Controls */}
        <TabsContent value="emergency" className="space-y-6">
          <motion.div variants={fadeIn}>
            <Card className="modern-card border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Emergency mode will immediately restrict all tenant operations 
                    and display maintenance notices. Only use during critical system issues.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between p-6 border-2 border-dashed border-destructive rounded-lg bg-destructive/5">
                  <div>
                    <h3 className="font-semibold text-lg">Platform Emergency Mode</h3>
                    <p className="text-muted-foreground">
                      {emergencyMode ? 'Platform is currently in emergency mode' : 'Platform is operating normally'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={emergencyMode ? 'destructive' : 'default'}>
                        {emergencyMode ? 'Emergency Active' : 'Normal Operations'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant={emergencyMode ? "destructive" : "outline"}
                    size="lg"
                    onClick={handleEmergencyToggle}
                    disabled={toggleEmergencyMode.isPending}
                    className="min-w-32"
                  >
                    {emergencyMode ? (
                      <>
                        <ToggleLeft className="h-5 w-5 mr-2" />
                        Disable
                      </>
                    ) : (
                      <>
                        <ToggleRight className="h-5 w-5 mr-2" />
                        {toggleEmergencyMode.isPending ? 'Activating...' : 'Activate'}
                      </>
                    )}
                  </Button>
                </div>

                {emergencyMode && (
                  <div className="space-y-4">
                    <Label htmlFor="emergencyMessage">Emergency Message (displayed to tenants)</Label>
                    <Textarea
                      id="emergencyMessage"
                      placeholder="System maintenance in progress. All services will be restored shortly."
                      className="min-h-20"
                    />
                    <Button variant="outline">Update Message</Button>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <h4 className="font-medium mb-3">Emergency Contacts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Technical Lead:</span>
                        <span className="font-medium">+234 123 456 7890</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DevOps:</span>
                        <span className="font-medium">+234 987 654 3210</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Support:</span>
                        <span className="font-medium">support@luxuryhotel.com</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Slack:</span>
                        <span className="font-medium">#emergency-response</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}