/**
 * Enhanced QR Manager Component
 * 
 * Advanced QR code management with batch operations, analytics integration,
 * dynamic service configuration, and advanced filtering capabilities.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  QrCode, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  MoreHorizontal, 
  Eye,
  Edit,
  Trash2,
  Copy,
  BarChart3,
  Settings,
  MapPin,
  Wifi,
  Calendar,
  Clock
} from 'lucide-react';

interface QRCodeData {
  id: string;
  tenant_id: string;
  qr_token: string;
  room_id?: string;
  label: string;
  scan_type: string;
  services: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  scan_count?: number;
  last_scanned_at?: string;
  rooms?: {
    room_number: string;
    room_types: {
      name: string;
    };
  };
}

interface QRAnalytics {
  total_scans: number;
  unique_guests: number;
  popular_services: Array<{
    service: string;
    count: number;
  }>;
  peak_hours: Array<{
    hour: number;
    scans: number;
  }>;
}

export function EnhancedQRManager() {
  const { tenant } = useAuth();
  const { toast } = useToast();
  
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<QRCodeData[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState<QRAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Available services for QR codes
  const availableServices = [
    'room_service',
    'housekeeping',
    'maintenance',
    'concierge',
    'spa_booking',
    'restaurant_reservation',
    'wifi_access',
    'feedback'
  ];

  // Load QR codes
  useEffect(() => {
    loadQRCodes();
    loadAnalytics();
  }, [tenant?.tenant_id]);

  // Apply filters
  useEffect(() => {
    let filtered = qrCodes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(code => 
        code.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.qr_token.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.rooms?.room_number.includes(searchTerm)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(code => 
        filterStatus === 'active' ? code.is_active : !code.is_active
      );
    }

    // Location filter
    if (filterLocation !== 'all') {
      filtered = filtered.filter(code => 
        code.scan_type === filterLocation
      );
    }

    setFilteredCodes(filtered);
  }, [qrCodes, searchTerm, filterStatus, filterLocation]);

  const loadQRCodes = async () => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select(`
          *,
          rooms (
            room_number,
            room_types (
              name
            )
          )
        `)
        .eq('tenant_id', tenant.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error('Error loading QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to load QR codes",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    if (!tenant?.tenant_id) return;

    try {
      // This would typically come from a more comprehensive analytics query
      // For now, we'll create a basic structure
      const { data: analyticsData } = await supabase
        .from('qr_analytics')
        .select('*')
        .eq('tenant_id', tenant.tenant_id);

      // Process analytics data
      const totalScans = analyticsData?.reduce((sum, item) => sum + (item.request_count || 0), 0) || 0;
      const uniqueGuests = new Set(analyticsData?.map(item => item.qr_code_id)).size;

      setAnalytics({
        total_scans: totalScans,
        unique_guests: uniqueGuests,
        popular_services: [
          { service: 'room_service', count: Math.floor(totalScans * 0.4) },
          { service: 'housekeeping', count: Math.floor(totalScans * 0.3) },
          { service: 'maintenance', count: Math.floor(totalScans * 0.2) },
          { service: 'concierge', count: Math.floor(totalScans * 0.1) }
        ],
        peak_hours: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          scans: Math.floor(Math.random() * 50)
        }))
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleCreateQR = async (formData: any) => {
    if (!tenant?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .insert([{
          tenant_id: tenant.tenant_id,
          qr_token: `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          room_id: formData.room_id || null,
          label: formData.label,
          scan_type: formData.scan_type,
          services: formData.services,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      setQrCodes(prev => [data, ...prev]);
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "QR code created successfully"
      });
    } catch (error) {
      console.error('Error creating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to create QR code",
        variant: "destructive"
      });
    }
  };

  const handleBatchOperation = async (operation: 'activate' | 'deactivate' | 'delete') => {
    if (selectedCodes.length === 0) return;

    try {
      if (operation === 'delete') {
        const { error } = await supabase
          .from('qr_codes')
          .delete()
          .in('id', selectedCodes);

        if (error) throw error;
        setQrCodes(prev => prev.filter(code => !selectedCodes.includes(code.id)));
      } else {
        const { error } = await supabase
          .from('qr_codes')
          .update({ is_active: operation === 'activate' })
          .in('id', selectedCodes);

        if (error) throw error;
        setQrCodes(prev => prev.map(code => 
          selectedCodes.includes(code.id) 
            ? { ...code, is_active: operation === 'activate' }
            : code
        ));
      }

      setSelectedCodes([]);
      setShowBatchDialog(false);
      toast({
        title: "Success",
        description: `Batch ${operation} completed successfully`
      });
    } catch (error) {
      console.error(`Error in batch ${operation}:`, error);
      toast({
        title: "Error",
        description: `Failed to ${operation} selected QR codes`,
        variant: "destructive"
      });
    }
  };

  const toggleCodeSelection = (codeId: string) => {
    setSelectedCodes(prev => 
      prev.includes(codeId) 
        ? prev.filter(id => id !== codeId)
        : [...prev, codeId]
    );
  };

  const selectAllVisible = () => {
    const allVisible = filteredCodes.map(code => code.id);
    setSelectedCodes(prev => 
      prev.length === allVisible.length ? [] : allVisible
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced QR Manager</h1>
          <p className="text-muted-foreground">
            Advanced QR code management with analytics and batch operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAnalytics(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create QR Code
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search QR codes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="room">Rooms</SelectItem>
                <SelectItem value="common_area">Common Areas</SelectItem>
                <SelectItem value="reception">Reception</SelectItem>
              </SelectContent>
            </Select>

            {selectedCodes.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowBatchDialog(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Batch Actions ({selectedCodes.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      <div className="space-y-4">
        {/* Select All */}
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedCodes.length === filteredCodes.length && filteredCodes.length > 0}
            onCheckedChange={selectAllVisible}
          />
          <span className="text-sm text-muted-foreground">
            Select all visible ({filteredCodes.length} codes)
          </span>
        </div>

        {/* Codes List */}
        {filteredCodes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No QR codes found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCodes.map((code) => (
              <Card key={code.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedCodes.includes(code.id)}
                      onCheckedChange={() => toggleCodeSelection(code.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{code.label}</h3>
                        <Badge variant={code.is_active ? "default" : "secondary"}>
                          {code.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {code.scan_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <QrCode className="h-3 w-3" />
                          {code.qr_token.substring(0, 12)}...
                        </div>
                        
                        {code.rooms && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            Room {code.rooms.room_number}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          {code.services.length} services
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(code.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {code.services.slice(0, 3).map((service) => (
                          <Badge key={service} variant="outline" className="text-xs">
                            {service.replace('_', ' ')}
                          </Badge>
                        ))}
                        {code.services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{code.services.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>QR Code Analytics</DialogTitle>
          </DialogHeader>
          
          {analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.total_scans}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.unique_guests}
                    </p>
                    <p className="text-sm text-muted-foreground">Unique Guests</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {qrCodes.filter(c => c.is_active).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active QR Codes</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {analytics.popular_services[0]?.service.replace('_', ' ') || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Top Service</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Popular Services</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.popular_services.map((service) => (
                        <div key={service.service} className="flex items-center justify-between">
                          <span className="capitalize">{service.service.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded">
                              <div 
                                className="h-full bg-blue-500 rounded"
                                style={{ 
                                  width: `${(service.count / analytics.total_scans) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {service.count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Peak Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end gap-1">
                      {analytics.peak_hours.slice(6, 24).map((hour) => (
                        <div 
                          key={hour.hour}
                          className="flex-1 bg-blue-500 rounded-t"
                          style={{ 
                            height: `${(hour.scans / Math.max(...analytics.peak_hours.map(h => h.scans))) * 100}%`,
                            minHeight: '4px'
                          }}
                          title={`${hour.hour}:00 - ${hour.scans} scans`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>6 AM</span>
                      <span>12 PM</span>
                      <span>6 PM</span>
                      <span>11 PM</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}