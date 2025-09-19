import React, { useState } from 'react';
import { QrCode, Plus, Download, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QRServiceCard } from '@/components/owner/qr/QRServiceCard';
import { QRGeneratorModal } from '@/components/owner/qr/QRGeneratorModal';
import { AuditLogsPanel } from '@/components/owner/qr/AuditLogsPanel';
import { useToast } from '@/hooks/use-toast';

interface QRService {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  scope: 'GLOBAL' | 'PER_ROOM';
  requestCount: number;
  description: string;
  color: string;
}

export default function QRManagerPage() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedService, setSelectedService] = useState<QRService | null>(null);
  const { toast } = useToast();

  const [services, setServices] = useState<QRService[]>([
    {
      id: 'wifi',
      name: 'Guest Wi-Fi',
      icon: '📶',
      active: true,
      scope: 'GLOBAL',
      requestCount: 0,
      description: 'Instant Wi-Fi access for guests',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'room-service',
      name: 'Room Service',
      icon: '🍽️',
      active: true,
      scope: 'PER_ROOM',
      requestCount: 12,
      description: 'Order food and beverages to room',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'housekeeping',
      name: 'Housekeeping',
      icon: '🧹',
      active: true,
      scope: 'PER_ROOM',
      requestCount: 8,
      description: 'Request cleaning and amenities',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      icon: '🔧',
      active: true,
      scope: 'PER_ROOM',
      requestCount: 3,
      description: 'Report room issues and repairs',
      color: 'bg-orange-100 text-orange-700'
    },
    {
      id: 'feedback',
      name: 'Feedback',
      icon: '📋',
      active: true,
      scope: 'GLOBAL',
      requestCount: 0,
      description: 'Guest reviews and comments',
      color: 'bg-pink-100 text-pink-700'
    },
    {
      id: 'menu',
      name: 'Digital Menu',
      icon: '📖',
      active: false,
      scope: 'GLOBAL',
      requestCount: 0,
      description: 'Restaurant and bar menus',
      color: 'bg-amber-100 text-amber-700'
    },
    {
      id: 'events',
      name: 'Events',
      icon: '🎉',
      active: false,
      scope: 'GLOBAL',
      requestCount: 0,
      description: 'Hotel events and packages',
      color: 'bg-indigo-100 text-indigo-700'
    }
  ]);

  const handleNewQRCode = () => {
    setSelectedService(null);
    setShowGenerator(true);
  };

  const handleEditService = (service: QRService) => {
    setSelectedService(service);
    setShowGenerator(true);
  };

  const handleToggleService = (serviceId: string) => {
    setServices(prev => prev.map(service => 
      service.id === serviceId 
        ? { ...service, active: !service.active }
        : service
    ));
    
    const service = services.find(s => s.id === serviceId);
    toast({
      title: `Service ${service?.active ? 'Deactivated' : 'Activated'}`,
      description: `${service?.name} QR codes are now ${service?.active ? 'inactive' : 'active'}`
    });
  };

  const handleBulkExport = () => {
    toast({
      title: "Export Started",
      description: "Generating QR code package for all rooms..."
    });
  };

  const handleViewAllCodes = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    toast({
      title: "View All Codes",
      description: `Showing all QR codes for ${service?.name}`
    });
  };

  const handlePrintExport = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    toast({
      title: "Print/Export",
      description: `Preparing ${service?.name} QR codes for printing`
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <QrCode className="h-8 w-8" />
            QR Code Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage branded QR codes for hotel services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBulkExport}>
            <Download className="h-4 w-4 mr-2" />
            Bulk Export
          </Button>
          <Button onClick={handleNewQRCode}>
            <Plus className="h-4 w-4 mr-2" />
            New QR Code
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <QRServiceCard
            key={service.id}
            service={service}
            onToggle={() => handleToggleService(service.id)}
            onEdit={() => handleEditService(service)}
            onViewAll={() => handleViewAllCodes(service.id)}
            onPrintExport={() => handlePrintExport(service.id)}
          />
        ))}
      </div>

      {/* Audit Logs */}
      <AuditLogsPanel />

      {/* QR Generator Modal */}
      <QRGeneratorModal
        open={showGenerator}
        onOpenChange={setShowGenerator}
        service={selectedService}
        onSave={(serviceData) => {
          if (selectedService) {
            // Update existing service
            setServices(prev => prev.map(s => 
              s.id === selectedService.id ? { ...s, ...serviceData } : s
            ));
            toast({
              title: "Service Updated",
              description: `${serviceData.name} has been updated successfully`
            });
          } else {
            // Create new service
            const newService: QRService = {
              id: `service_${Date.now()}`,
              requestCount: 0,
              ...serviceData
            };
            setServices(prev => [...prev, newService]);
            toast({
              title: "Service Created",
              description: `${serviceData.name} QR codes generated successfully`
            });
          }
          setShowGenerator(false);
          setSelectedService(null);
        }}
      />
    </div>
  );
}