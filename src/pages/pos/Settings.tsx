import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Printer, 
  Settings as SettingsIcon,
  Wifi,
  Bell,
  DollarSign,
  Clock,
  Users,
  Save,
  TestTube,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    // Printer Settings
    receiptPrinter: {
      enabled: true,
      ip: '192.168.1.100',
      port: '9100',
      paperSize: '80mm',
      template: 'standard'
    },
    kitchenPrinter: {
      enabled: true,
      stations: {
        grill: { printer: 'Kitchen-Grill-01', ip: '192.168.1.101' },
        cold: { printer: 'Kitchen-Cold-01', ip: '192.168.1.102' },
        bar: { printer: 'Kitchen-Bar-01', ip: '192.168.1.103' }
      }
    },
    
    // Order Settings
    orderSettings: {
      autoAcceptTimeout: 300, // 5 minutes
      orderEtaDefault: 20,
      maxOrderTime: 60,
      enableOrderPhotos: true,
      requireManagerApprovalForVoids: true
    },
    
    // Payment Settings
    paymentSettings: {
      enableRoomCharges: true,
      enableCashPayments: true,
      enableCardPayments: true,
      taxRate: 7.5,
      serviceCharge: 0,
      autoCalculateTax: true
    },
    
    // Notification Settings
    notifications: {
      newOrderSound: true,
      urgentOrderAlert: true,
      kitchenReadyAlert: true,
      paymentFailureAlert: true,
      emailReports: true,
      reportEmail: 'manager@hotel.com'
    },
    
    // KDS Settings
    kdsSettings: {
      autoProgressOrders: false,
      showPhotos: true,
      colorCodePriority: true,
      refreshInterval: 5,
      showTimers: true
    }
  });

  const handleSaveSettings = () => {
    // In production, this would save to the backend
    toast({
      title: "Settings Saved",
      description: "All POS settings have been updated successfully.",
    });
  };

  const handleTestPrinter = (printerType: string) => {
    toast({
      title: "Test Print Sent",
      description: `Test page sent to ${printerType} printer.`,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">POS Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure restaurant POS system preferences and hardware
          </p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>

      <Tabs defaultValue="printers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="printers">Printers</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="kds">Kitchen Display</TabsTrigger>
        </TabsList>

        {/* Printer Settings */}
        <TabsContent value="printers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receipt Printer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Receipt Printer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="receiptEnabled">Enable Receipt Printing</Label>
                  <Switch
                    id="receiptEnabled"
                    checked={settings.receiptPrinter.enabled}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        receiptPrinter: { ...settings.receiptPrinter, enabled: checked }
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="receiptIp">Printer IP Address</Label>
                  <Input
                    id="receiptIp"
                    value={settings.receiptPrinter.ip}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        receiptPrinter: { ...settings.receiptPrinter, ip: e.target.value }
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="receiptPort">Port</Label>
                  <Input
                    id="receiptPort"
                    value={settings.receiptPrinter.port}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        receiptPrinter: { ...settings.receiptPrinter, port: e.target.value }
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Paper Size</Label>
                  <Select 
                    value={settings.receiptPrinter.paperSize}
                    onValueChange={(value) => 
                      setSettings({
                        ...settings,
                        receiptPrinter: { ...settings.receiptPrinter, paperSize: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="58mm">58mm</SelectItem>
                      <SelectItem value="80mm">80mm</SelectItem>
                      <SelectItem value="A4">A4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleTestPrinter('receipt')}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Print Receipt
                </Button>
              </CardContent>
            </Card>

            {/* Kitchen Printers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Printer className="h-5 w-5" />
                  Kitchen Printers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Kitchen Printing</Label>
                  <Switch
                    checked={settings.kitchenPrinter.enabled}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        kitchenPrinter: { ...settings.kitchenPrinter, enabled: checked }
                      })
                    }
                  />
                </div>

                <div className="space-y-3">
                  {Object.entries(settings.kitchenPrinter.stations).map(([station, config]) => (
                    <div key={station} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="capitalize font-medium">{station} Station</Label>
                        <Badge variant="outline">Connected</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Printer Name</Label>
                          <Input 
                            value={config.printer}
                            onChange={(e) => {
                              const updatedStations = {
                                ...settings.kitchenPrinter.stations,
                                [station]: { ...config, printer: e.target.value }
                              };
                              setSettings({
                                ...settings,
                                kitchenPrinter: { ...settings.kitchenPrinter, stations: updatedStations }
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">IP Address</Label>
                          <Input 
                            value={config.ip}
                            onChange={(e) => {
                              const updatedStations = {
                                ...settings.kitchenPrinter.stations,
                                [station]: { ...config, ip: e.target.value }
                              };
                              setSettings({
                                ...settings,
                                kitchenPrinter: { ...settings.kitchenPrinter, stations: updatedStations }
                              });
                            }}
                          />
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => handleTestPrinter(station)}
                      >
                        Test Print
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Order Settings */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Management
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="autoAccept">Auto-Accept Timeout (seconds)</Label>
                  <Input
                    id="autoAccept"
                    type="number"
                    value={settings.orderSettings.autoAcceptTimeout}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        orderSettings: { ...settings.orderSettings, autoAcceptTimeout: parseInt(e.target.value) || 0 }
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Orders will be flagged if not accepted within this time
                  </p>
                </div>

                <div>
                  <Label htmlFor="defaultEta">Default ETA (minutes)</Label>
                  <Input
                    id="defaultEta"
                    type="number"
                    value={settings.orderSettings.orderEtaDefault}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        orderSettings: { ...settings.orderSettings, orderEtaDefault: parseInt(e.target.value) || 0 }
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="maxTime">Maximum Order Time (minutes)</Label>
                  <Input
                    id="maxTime"
                    type="number"
                    value={settings.orderSettings.maxOrderTime}
                    onChange={(e) => 
                      setSettings({
                        ...settings,
                        orderSettings: { ...settings.orderSettings, maxOrderTime: Number(e.target.value) }
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enablePhotos">Enable Order Photos</Label>
                  <Switch
                    id="enablePhotos"
                    checked={settings.orderSettings.enableOrderPhotos}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        orderSettings: { ...settings.orderSettings, enableOrderPhotos: checked }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="managerApproval">Require Manager Approval for Voids</Label>
                  <Switch
                    id="managerApproval"
                    checked={settings.orderSettings.requireManagerApprovalForVoids}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        orderSettings: { ...settings.orderSettings, requireManagerApprovalForVoids: checked }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Methods</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Room Folio Charges</Label>
                    <Switch
                      checked={settings.paymentSettings.enableRoomCharges}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          paymentSettings: { ...settings.paymentSettings, enableRoomCharges: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Cash Payments</Label>
                    <Switch
                      checked={settings.paymentSettings.enableCashPayments}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          paymentSettings: { ...settings.paymentSettings, enableCashPayments: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Card Payments</Label>
                    <Switch
                      checked={settings.paymentSettings.enableCardPayments}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          paymentSettings: { ...settings.paymentSettings, enableCardPayments: checked }
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tax & Charges</h3>
                  
                  <div>
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={settings.paymentSettings.taxRate}
                      onChange={(e) => 
                        setSettings({
                          ...settings,
                          paymentSettings: { ...settings.paymentSettings, taxRate: Number(e.target.value) }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="serviceCharge">Service Charge (%)</Label>
                    <Input
                      id="serviceCharge"
                      type="number"
                      step="0.1"
                      value={settings.paymentSettings.serviceCharge}
                      onChange={(e) => 
                        setSettings({
                          ...settings,
                          paymentSettings: { ...settings.paymentSettings, serviceCharge: Number(e.target.value) }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Auto Calculate Tax</Label>
                    <Switch
                      checked={settings.paymentSettings.autoCalculateTax}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          paymentSettings: { ...settings.paymentSettings, autoCalculateTax: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Sound Alerts</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>New Order Sound</Label>
                    <Switch
                      checked={settings.notifications.newOrderSound}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, newOrderSound: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Urgent Order Alert</Label>
                    <Switch
                      checked={settings.notifications.urgentOrderAlert}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, urgentOrderAlert: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Kitchen Ready Alert</Label>
                    <Switch
                      checked={settings.notifications.kitchenReadyAlert}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, kitchenReadyAlert: checked }
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Email Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label>Daily Email Reports</Label>
                    <Switch
                      checked={settings.notifications.emailReports}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailReports: checked }
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="reportEmail">Report Email Address</Label>
                    <Input
                      id="reportEmail"
                      type="email"
                      value={settings.notifications.reportEmail}
                      onChange={(e) => 
                        setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, reportEmail: e.target.value }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KDS Settings */}
        <TabsContent value="kds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Kitchen Display System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Auto Progress Orders</Label>
                    <Switch
                      checked={settings.kdsSettings.autoProgressOrders}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          kdsSettings: { ...settings.kdsSettings, autoProgressOrders: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Order Photos</Label>
                    <Switch
                      checked={settings.kdsSettings.showPhotos}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          kdsSettings: { ...settings.kdsSettings, showPhotos: checked }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Color Code Priority</Label>
                    <Switch
                      checked={settings.kdsSettings.colorCodePriority}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          kdsSettings: { ...settings.kdsSettings, colorCodePriority: checked }
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="refreshInterval">Refresh Interval (seconds)</Label>
                    <Input
                      id="refreshInterval"
                      type="number"
                      value={settings.kdsSettings.refreshInterval}
                      onChange={(e) => 
                        setSettings({
                          ...settings,
                          kdsSettings: { ...settings.kdsSettings, refreshInterval: Number(e.target.value) }
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Prep Timers</Label>
                    <Switch
                      checked={settings.kdsSettings.showTimers}
                      onCheckedChange={(checked) => 
                        setSettings({
                          ...settings,
                          kdsSettings: { ...settings.kdsSettings, showTimers: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}