import React, { useState, useEffect } from 'react';
import { QrCode, Wifi, UtensilsCrossed, Wrench, MessageSquare, Menu, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

interface QRGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: QRService | null;
  onSave: (serviceData: any) => void;
}

const serviceTemplates = [
  { id: 'wifi', name: 'Guest Wi-Fi', icon: Wifi, color: 'bg-blue-100 text-blue-700' },
  { id: 'room-service', name: 'Room Service', icon: UtensilsCrossed, color: 'bg-green-100 text-green-700' },
  { id: 'housekeeping', name: 'Housekeeping', icon: UtensilsCrossed, color: 'bg-purple-100 text-purple-700' },
  { id: 'maintenance', name: 'Maintenance', icon: Wrench, color: 'bg-orange-100 text-orange-700' },
  { id: 'feedback', name: 'Feedback', icon: MessageSquare, color: 'bg-pink-100 text-pink-700' },
  { id: 'menu', name: 'Digital Menu', icon: Menu, color: 'bg-amber-100 text-amber-700' },
  { id: 'events', name: 'Events', icon: Calendar, color: 'bg-indigo-100 text-indigo-700' }
];

export const QRGeneratorModal = ({ open, onOpenChange, service, onSave }: QRGeneratorModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    scope: 'PER_ROOM' as 'GLOBAL' | 'PER_ROOM',
    active: true,
    icon: '🍽️',
    color: 'bg-green-100 text-green-700',
    size: '256',
    format: 'PNG' as 'PNG' | 'SVG' | 'PDF',
    branding: {
      logo: true,
      hotelName: true,
      colorScheme: 'primary'
    }
  });

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        scope: service.scope,
        active: service.active,
        icon: service.icon,
        color: service.color,
        size: '256',
        format: 'PNG',
        branding: {
          logo: true,
          hotelName: true,
          colorScheme: 'primary'
        }
      });
    } else {
      setFormData({
        name: '',
        description: '',
        scope: 'PER_ROOM',
        active: true,
        icon: '🍽️',
        color: 'bg-green-100 text-green-700',
        size: '256',
        format: 'PNG',
        branding: {
          logo: true,
          hotelName: true,
          colorScheme: 'primary'
        }
      });
    }
  }, [service, open]);

  const handleServiceTypeSelect = (templateId: string) => {
    const template = serviceTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        name: template.name,
        color: template.color,
        icon: template.id === 'wifi' ? '📶' : 
              template.id === 'room-service' ? '🍽️' :
              template.id === 'housekeeping' ? '🧹' :
              template.id === 'maintenance' ? '🔧' :
              template.id === 'feedback' ? '📋' :
              template.id === 'menu' ? '📖' : '🎉'
      }));
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            {service ? 'Edit QR Service' : 'Create New QR Service'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Panel - Configuration */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Service Configuration</h3>
              
              {!service && (
                <div>
                  <Label>Service Type</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {serviceTemplates.map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => handleServiceTypeSelect(template.id)}
                          className={`p-3 border rounded-lg text-left hover:border-primary transition-colors ${
                            formData.name === template.name ? 'border-primary bg-primary/5' : 'border-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="text-sm font-medium">{template.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="service-name">Service Name</Label>
                <Input
                  id="service-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter service name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the service"
                  rows={3}
                />
              </div>

              <div>
                <Label>Scope</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="global"
                      name="scope"
                      checked={formData.scope === 'GLOBAL'}
                      onChange={() => setFormData(prev => ({ ...prev, scope: 'GLOBAL' }))}
                    />
                    <Label htmlFor="global">Global (single code)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="per-room"
                      name="scope"
                      checked={formData.scope === 'PER_ROOM'}
                      onChange={() => setFormData(prev => ({ ...prev, scope: 'PER_ROOM' }))}
                    />
                    <Label htmlFor="per-room">Per-Room (unique codes)</Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Design Options</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Size</Label>
                  <Select value={formData.size} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, size: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">128px (Small)</SelectItem>
                      <SelectItem value="256">256px (Medium)</SelectItem>
                      <SelectItem value="512">512px (Large)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Format</Label>
                  <Select value={formData.format} onValueChange={(value: 'PNG' | 'SVG' | 'PDF') => 
                    setFormData(prev => ({ ...prev, format: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PNG">PNG</SelectItem>
                      <SelectItem value="SVG">SVG</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Include Hotel Logo</Label>
                  <Switch
                    checked={formData.branding.logo}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        branding: { ...prev.branding, logo: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Include Hotel Name</Label>
                  <Switch
                    checked={formData.branding.hotelName}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        branding: { ...prev.branding, hotelName: checked }
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="space-y-4">
                    {formData.branding.logo && (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
                        <span className="text-primary font-bold">LGH</span>
                      </div>
                    )}
                    
                    <div className="w-32 h-32 bg-foreground rounded-lg mx-auto flex items-center justify-center">
                      <div className="w-24 h-24 bg-background rounded-sm"></div>
                    </div>
                    
                    {formData.branding.hotelName && (
                      <h4 className="font-semibold">Lagos Grand Hotel</h4>
                    )}
                    
                    <div className="space-y-2">
                      <p className="font-medium">{formData.name || 'Service Name'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formData.description || 'Service description'}
                      </p>
                    </div>
                    
                    <div className="flex justify-center gap-2">
                      <Badge variant="outline">{formData.format}</Badge>
                      <Badge variant="outline">{formData.size}px</Badge>
                      <Badge variant="outline">
                        {formData.scope === 'GLOBAL' ? 'Global' : 'Per Room'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Generated URLs:</strong></p>
              {formData.scope === 'GLOBAL' ? (
                <p className="font-mono bg-muted p-2 rounded text-xs">
                  https://hotel.app/guest/service/{formData.name.toLowerCase().replace(/\s+/g, '-')}
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="font-mono bg-muted p-2 rounded text-xs">
                    https://hotel.app/guest/room/101/{formData.name.toLowerCase().replace(/\s+/g, '-')}
                  </p>
                  <p className="font-mono bg-muted p-2 rounded text-xs">
                    https://hotel.app/guest/room/102/{formData.name.toLowerCase().replace(/\s+/g, '-')}
                  </p>
                  <p className="text-center">... (one per room)</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.name.trim()}>
            {service ? 'Update Service' : 'Generate QR Codes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};