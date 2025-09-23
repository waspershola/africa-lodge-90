import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Settings, 
  FileText, 
  Image, 
  Palette, 
  Globe, 
  Download,
  Eye,
  Copy,
  Upload
} from "lucide-react";
import { useTenantInfo } from "@/hooks/useTenantInfo";

interface ReceiptTemplate {
  id: string;
  name: string;
  type: 'A4' | 'A5' | '80mm' | '58mm';
  department: 'front-desk' | 'restaurant' | 'spa' | 'housekeeping' | 'laundry' | 'minibar' | 'all';
  transactionTypes: ('check-in' | 'check-out' | 'room-service' | 'restaurant' | 'spa' | 'laundry' | 'minibar' | 'folio' | 'deposit' | 'refund')[];
  isDefault: boolean;
  branding: {
    showLogo: boolean;
    showHotelName: boolean;
    showAddress: boolean;
    showContact: boolean;
    showWebsite: boolean;
    showSocialMedia: boolean;
    headerText?: string;
    footerText?: string;
    watermark?: string;
    colorScheme: 'default' | 'branded' | 'minimal';
  };
  content: {
    showVATBreakdown: boolean;
    showStaffName: boolean;
    showQRCode: boolean;
    showPaymentMethods: boolean;
    showGuestSignature: boolean;
    showTermsConditions: boolean;
    showRefundPolicy: boolean;
    showItemizedCharges: boolean;
    showRoomDetails: boolean;
    showStayDuration: boolean;
    showLoyaltyPoints: boolean;
    showPromotionalOffers: boolean;
  };
  departmentSpecific: {
    frontDesk: {
      showRoomNumber: boolean;
      showCheckInOut: boolean;
      showDepositInfo: boolean;
      includeKeyCards: boolean;
    };
    restaurant: {
      showTableNumber: boolean;
      showServerName: boolean;
      showMenuCategories: boolean;
      showNutritionalInfo: boolean;
    };
    spa: {
      showTherapistName: boolean;
      showTreatmentDuration: boolean;
      showPackageDetails: boolean;
    };
  };
  integration: {
    connectToReservations: boolean;
    connectToRoomCharges: boolean;
    connectToRestaurantPOS: boolean;
    connectToSpaBooking: boolean;
    connectToLaundryService: boolean;
    connectToMinibarSystem: boolean;
    autoGenerateOnCheckIn: boolean;
    autoGenerateOnCheckOut: boolean;
    autoEmailToGuest: boolean;
    sendToAccountingSystem: boolean;
  };
  language: string;
  currency: string;
  taxSettings: {
    includeTax: boolean;
    taxRate: number;
    taxLabel: string;
    showTaxNumber: boolean;
  };
}

interface ReceiptSettingsProps {
  onDataChange: () => void;
}

const defaultTemplate: ReceiptTemplate = {
  id: '1',
  name: 'Standard A4 Receipt',
  type: 'A4',
  department: 'all',
  transactionTypes: ['check-in', 'check-out', 'room-service', 'restaurant', 'folio'],
  isDefault: true,
  branding: {
    showLogo: true,
    showHotelName: true,
    showAddress: true,
    showContact: true,
    showWebsite: true,
    showSocialMedia: false,
    headerText: 'Thank you for staying with us',
    footerText: 'We appreciate your business',
    colorScheme: 'default',
  },
  content: {
    showVATBreakdown: true,
    showStaffName: true,
    showQRCode: true,
    showPaymentMethods: true,
    showGuestSignature: false,
    showTermsConditions: true,
    showRefundPolicy: false,
    showItemizedCharges: true,
    showRoomDetails: true,
    showStayDuration: true,
    showLoyaltyPoints: false,
    showPromotionalOffers: false,
  },
  departmentSpecific: {
    frontDesk: {
      showRoomNumber: true,
      showCheckInOut: true,
      showDepositInfo: true,
      includeKeyCards: false,
    },
    restaurant: {
      showTableNumber: true,
      showServerName: true,
      showMenuCategories: false,
      showNutritionalInfo: false,
    },
    spa: {
      showTherapistName: true,
      showTreatmentDuration: true,
      showPackageDetails: true,
    },
  },
  integration: {
    connectToReservations: true,
    connectToRoomCharges: true,
    connectToRestaurantPOS: true,
    connectToSpaBooking: true,
    connectToLaundryService: true,
    connectToMinibarSystem: true,
    autoGenerateOnCheckIn: true,
    autoGenerateOnCheckOut: true,
    autoEmailToGuest: true,
    sendToAccountingSystem: false,
  },
  language: 'en',
  currency: 'NGN',
  taxSettings: {
    includeTax: true,
    taxRate: 7.5,
    taxLabel: 'VAT',
    showTaxNumber: true,
  },
};

export default function ReceiptSettings({ onDataChange }: ReceiptSettingsProps) {
  const { data: tenantInfo } = useTenantInfo();
  const [templates, setTemplates] = useState<ReceiptTemplate[]>([defaultTemplate]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplate>(defaultTemplate);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const paperSizes = [
    { value: 'A4', label: 'A4 (Full Page)', description: 'Standard full page format' },
    { value: 'A5', label: 'A5 (Half Page)', description: 'Compact half page format' },
    { value: '80mm', label: '80mm Thermal', description: 'POS printer standard' },
    { value: '58mm', label: '58mm Thermal', description: 'Compact POS printer' },
  ];

  const departments = [
    { value: 'all', label: 'All Departments' },
    { value: 'front-desk', label: 'Front Desk & Reception' },
    { value: 'restaurant', label: 'Restaurant & F&B' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'housekeeping', label: 'Housekeeping' },
    { value: 'laundry', label: 'Laundry Services' },
    { value: 'minibar', label: 'Minibar & Room Service' },
  ];

  const transactionTypes = [
    { value: 'check-in', label: 'Check-In Receipt' },
    { value: 'check-out', label: 'Check-Out Invoice' },
    { value: 'room-service', label: 'Room Service Bill' },
    { value: 'restaurant', label: 'Restaurant Bill' },
    { value: 'spa', label: 'Spa Treatment Invoice' },
    { value: 'laundry', label: 'Laundry Service Bill' },
    { value: 'minibar', label: 'Minibar Charges' },
    { value: 'folio', label: 'Guest Folio' },
    { value: 'deposit', label: 'Deposit Receipt' },
    { value: 'refund', label: 'Refund Receipt' },
  ];

  const colorSchemes = [
    { value: 'default', label: 'Default Theme' },
    { value: 'branded', label: 'Hotel Brand Colors' },
    { value: 'minimal', label: 'Minimal B&W' },
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'French' },
    { value: 'es', label: 'Spanish' },
    { value: 'ar', label: 'Arabic' },
  ];

  const currencies = [
    { value: 'NGN', label: '₦ Nigerian Naira' },
    { value: 'USD', label: '$ US Dollar' },
    { value: 'EUR', label: '€ Euro' },
    { value: 'GBP', label: '£ British Pound' },
  ];

  const handleTemplateChange = (field: string, value: any) => {
    setSelectedTemplate(prev => ({
      ...prev,
      [field]: value,
    }));
    onDataChange();
  };

  const handleBrandingChange = (field: string, value: any) => {
    setSelectedTemplate(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [field]: value,
      },
    }));
    onDataChange();
  };

  const handleContentChange = (field: string, value: any) => {
    setSelectedTemplate(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value,
      },
    }));
    onDataChange();
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      onDataChange();
      toast({
        title: "Logo uploaded",
        description: "Receipt templates will use the new logo",
      });
    }
  };

  const handleSaveTemplate = () => {
    setTemplates(prev => 
      prev.map(t => t.id === selectedTemplate.id ? selectedTemplate : t)
    );
    toast({
      title: "Template saved",
      description: `${selectedTemplate.name} has been updated`,
    });
  };

  const handleDuplicateTemplate = () => {
    const newTemplate: ReceiptTemplate = {
      ...selectedTemplate,
      id: Date.now().toString(),
      name: `${selectedTemplate.name} (Copy)`,
      isDefault: false,
    };
    setTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplate(newTemplate);
    onDataChange();
    toast({
      title: "Template duplicated",
      description: "Created a copy of the current template",
    });
  };

  const handleSetDefault = () => {
    setTemplates(prev => 
      prev.map(t => ({
        ...t,
        isDefault: t.id === selectedTemplate.id
      }))
    );
    setSelectedTemplate(prev => ({ ...prev, isDefault: true }));
    onDataChange();
    toast({
      title: "Default template set",
      description: `${selectedTemplate.name} is now the default template`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Receipt & Slip Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure receipt templates, branding, and printing options
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicateTemplate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button size="sm" onClick={handleSaveTemplate}>
            Save Template
          </Button>
        </div>
      </div>

      <Tabs defaultValue="template" className="space-y-4">
        <TabsList>
          <TabsTrigger value="template">Template Settings</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="content">Content Options</TabsTrigger>
          <TabsTrigger value="department">Department Config</TabsTrigger>
          <TabsTrigger value="integration">System Integration</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="template" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Basic Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={selectedTemplate.name}
                    onChange={(e) => handleTemplateChange('name', e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paper-size">Paper Size</Label>
                  <Select
                    value={selectedTemplate.type}
                    onValueChange={(value) => handleTemplateChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select paper size" />
                    </SelectTrigger>
                    <SelectContent>
                      {paperSizes.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          <div>
                            <div className="font-medium">{size.label}</div>
                            <div className="text-xs text-muted-foreground">{size.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={selectedTemplate.department}
                    onValueChange={(value) => handleTemplateChange('department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="default-template">Default Template</Label>
                  <div className="flex items-center gap-2">
                    {selectedTemplate.isDefault && (
                      <Badge variant="default" className="text-xs">Default</Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSetDefault}
                      disabled={selectedTemplate.isDefault}
                    >
                      Set as Default
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={selectedTemplate.language}
                    onValueChange={(value) => handleTemplateChange('language', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={selectedTemplate.currency}
                    onValueChange={(value) => handleTemplateChange('currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Template Management</h4>
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate.id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.type} • {departments.find(d => d.value === template.department)?.label}
                            </div>
                          </div>
                          {template.isDefault && (
                            <Badge variant="default" className="text-xs">Default</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Logo & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-upload">Hotel Logo</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
                {logoFile && (
                  <p className="text-sm text-muted-foreground">
                    Uploaded: {logoFile.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-logo">Show Logo</Label>
                  <Switch
                    id="show-logo"
                    checked={selectedTemplate.branding.showLogo}
                    onCheckedChange={(checked) => handleBrandingChange('showLogo', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-hotel-name">Show Hotel Name</Label>
                  <Switch
                    id="show-hotel-name"
                    checked={selectedTemplate.branding.showHotelName}
                    onCheckedChange={(checked) => handleBrandingChange('showHotelName', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-address">Show Address</Label>
                  <Switch
                    id="show-address"
                    checked={selectedTemplate.branding.showAddress}
                    onCheckedChange={(checked) => handleBrandingChange('showAddress', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-contact">Show Contact Info</Label>
                  <Switch
                    id="show-contact"
                    checked={selectedTemplate.branding.showContact}
                    onCheckedChange={(checked) => handleBrandingChange('showContact', checked)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="header-text">Header Text</Label>
                  <Input
                    id="header-text"
                    value={selectedTemplate.branding.headerText || ''}
                    onChange={(e) => handleBrandingChange('headerText', e.target.value)}
                    placeholder="e.g., Thank you for staying with us"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-text">Footer Text</Label>
                  <Textarea
                    id="footer-text"
                    value={selectedTemplate.branding.footerText || ''}
                    onChange={(e) => handleBrandingChange('footerText', e.target.value)}
                    placeholder="e.g., We appreciate your business"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="watermark">Watermark Text</Label>
                  <Input
                    id="watermark"
                    value={selectedTemplate.branding.watermark || ''}
                    onChange={(e) => handleBrandingChange('watermark', e.target.value)}
                    placeholder="e.g., PAID, ORIGINAL, COPY"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Financial Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-vat">Show VAT/Tax Breakdown</Label>
                      <Switch
                        id="show-vat"
                        checked={selectedTemplate.content.showVATBreakdown}
                        onCheckedChange={(checked) => handleContentChange('showVATBreakdown', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-payment-methods">Show Payment Methods</Label>
                      <Switch
                        id="show-payment-methods"
                        checked={selectedTemplate.content.showPaymentMethods}
                        onCheckedChange={(checked) => handleContentChange('showPaymentMethods', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Additional Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-staff">Show Staff Name</Label>
                      <Switch
                        id="show-staff"
                        checked={selectedTemplate.content.showStaffName}
                        onCheckedChange={(checked) => handleContentChange('showStaffName', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-qr">Include QR Code</Label>
                      <Switch
                        id="show-qr"
                        checked={selectedTemplate.content.showQRCode}
                        onCheckedChange={(checked) => handleContentChange('showQRCode', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="include-terms">Include Terms & Conditions</Label>
                      <Switch
                        id="include-terms"
                        checked={selectedTemplate.content.showTermsConditions}
                        onCheckedChange={(checked) => handleContentChange('showTermsConditions', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="department" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Front Desk Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Transaction Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {transactionTypes.slice(0, 4).map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`transaction-${type.value}`}
                          checked={selectedTemplate.transactionTypes.includes(type.value as any)}
                          onChange={(e) => {
                            const types = e.target.checked
                              ? [...selectedTemplate.transactionTypes, type.value]
                              : selectedTemplate.transactionTypes.filter(t => t !== type.value);
                            handleTemplateChange('transactionTypes', types);
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`transaction-${type.value}`} className="text-sm">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Show Room Number</Label>
                    <Switch
                      checked={selectedTemplate.departmentSpecific.frontDesk.showRoomNumber}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          departmentSpecific: {
                            ...prev.departmentSpecific,
                            frontDesk: { ...prev.departmentSpecific.frontDesk, showRoomNumber: checked }
                          }
                        }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Show Check-in/Check-out Dates</Label>
                    <Switch
                      checked={selectedTemplate.departmentSpecific.frontDesk.showCheckInOut}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          departmentSpecific: {
                            ...prev.departmentSpecific,
                            frontDesk: { ...prev.departmentSpecific.frontDesk, showCheckInOut: checked }
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Deposit Information</Label>
                    <Switch
                      checked={selectedTemplate.departmentSpecific.frontDesk.showDepositInfo}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          departmentSpecific: {
                            ...prev.departmentSpecific,
                            frontDesk: { ...prev.departmentSpecific.frontDesk, showDepositInfo: checked }
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Include Key Card Info</Label>
                    <Switch
                      checked={selectedTemplate.departmentSpecific.frontDesk.includeKeyCards}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          departmentSpecific: {
                            ...prev.departmentSpecific,
                            frontDesk: { ...prev.departmentSpecific.frontDesk, includeKeyCards: checked }
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Restaurant & F&B Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Show Table Number</Label>
                    <Switch
                      checked={selectedTemplate.departmentSpecific.restaurant.showTableNumber}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          departmentSpecific: {
                            ...prev.departmentSpecific,
                            restaurant: { ...prev.departmentSpecific.restaurant, showTableNumber: checked }
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Server Name</Label>
                    <Switch
                      checked={selectedTemplate.departmentSpecific.restaurant.showServerName}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          departmentSpecific: {
                            ...prev.departmentSpecific,
                            restaurant: { ...prev.departmentSpecific.restaurant, showServerName: checked }
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Menu Categories</Label>
                    <Switch
                      checked={selectedTemplate.departmentSpecific.restaurant.showMenuCategories}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          departmentSpecific: {
                            ...prev.departmentSpecific,
                            restaurant: { ...prev.departmentSpecific.restaurant, showMenuCategories: checked }
                          }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Show Nutritional Info</Label>
                    <Switch
                      checked={selectedTemplate.departmentSpecific.restaurant.showNutritionalInfo}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          departmentSpecific: {
                            ...prev.departmentSpecific,
                            restaurant: { ...prev.departmentSpecific.restaurant, showNutritionalInfo: checked }
                          }
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <Card className="p-3 bg-muted/50">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tax Configuration</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="tax-rate" className="text-xs">Tax Rate (%)</Label>
                        <Input
                          id="tax-rate"
                          type="number"
                          step="0.1"
                          value={selectedTemplate.taxSettings.taxRate}
                          onChange={(e) => 
                            setSelectedTemplate(prev => ({
                              ...prev,
                              taxSettings: { ...prev.taxSettings, taxRate: parseFloat(e.target.value) || 0 }
                            }))
                          }
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tax-label" className="text-xs">Tax Label</Label>
                        <Input
                          id="tax-label"
                          value={selectedTemplate.taxSettings.taxLabel}
                          onChange={(e) => 
                            setSelectedTemplate(prev => ({
                              ...prev,
                              taxSettings: { ...prev.taxSettings, taxLabel: e.target.value }
                            }))
                          }
                          placeholder="VAT, GST, etc."
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  System Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Connect to Reservations</Label>
                      <p className="text-xs text-muted-foreground">Link with booking system</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.connectToReservations}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, connectToReservations: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Connect to Room Charges</Label>
                      <p className="text-xs text-muted-foreground">Include room service charges</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.connectToRoomCharges}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, connectToRoomCharges: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Connect to Restaurant POS</Label>
                      <p className="text-xs text-muted-foreground">Link F&B transactions</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.connectToRestaurantPOS}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, connectToRestaurantPOS: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Connect to Spa Booking</Label>
                      <p className="text-xs text-muted-foreground">Include spa treatments</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.connectToSpaBooking}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, connectToSpaBooking: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Connect to Minibar System</Label>
                      <p className="text-xs text-muted-foreground">Track minibar consumption</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.connectToMinibarSystem}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, connectToMinibarSystem: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Automation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-generate on Check-in</Label>
                      <p className="text-xs text-muted-foreground">Create receipt automatically</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.autoGenerateOnCheckIn}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, autoGenerateOnCheckIn: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-generate on Check-out</Label>
                      <p className="text-xs text-muted-foreground">Create final invoice automatically</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.autoGenerateOnCheckOut}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, autoGenerateOnCheckOut: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-email to Guest</Label>
                      <p className="text-xs text-muted-foreground">Send receipts via email</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.autoEmailToGuest}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, autoEmailToGuest: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Send to Accounting System</Label>
                      <p className="text-xs text-muted-foreground">Export to external accounting</p>
                    </div>
                    <Switch
                      checked={selectedTemplate.integration.sendToAccountingSystem}
                      onCheckedChange={(checked) => 
                        setSelectedTemplate(prev => ({
                          ...prev,
                          integration: { ...prev.integration, sendToAccountingSystem: checked }
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <Card className="p-3 bg-muted/50">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Advanced Content</Label>
                    <div className="space-y-2">
                      {[
                        { key: 'showLoyaltyPoints', label: 'Show Loyalty Points' },
                        { key: 'showPromotionalOffers', label: 'Show Promotional Offers' },
                        { key: 'showGuestSignature', label: 'Include Guest Signature Line' },
                        { key: 'showRefundPolicy', label: 'Show Refund Policy' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <Label className="text-xs">{item.label}</Label>
                          <Switch
                            checked={selectedTemplate.content[item.key as keyof typeof selectedTemplate.content] as boolean}
                            onCheckedChange={(checked) => handleContentChange(item.key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Template Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white text-black min-h-96">
                <div className="text-center mb-6">
                  {selectedTemplate.branding.showLogo && (
                    <div className="w-16 h-16 bg-gray-200 rounded mx-auto mb-4" />
                  )}
                  {selectedTemplate.branding.showHotelName && (
                    <h1 className="text-2xl font-bold">{tenantInfo?.hotel_name || "Your Hotel Name"}</h1>
                  )}
                  {selectedTemplate.branding.showAddress && (
                    <p className="text-sm">{tenantInfo?.address || "Hotel Address"}</p>
                  )}
                  {selectedTemplate.branding.showContact && (
                    <p className="text-sm">Tel: {tenantInfo?.phone || "+234 XXX XXX XXXX"} | Email: {tenantInfo?.email || "info@hotel.com"}</p>
                  )}
                  {selectedTemplate.branding.headerText && (
                    <p className="text-sm mt-2 italic">{selectedTemplate.branding.headerText}</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Receipt #: INV-001</span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                  
                  <div>
                    <strong>Guest:</strong> John Doe<br />
                    <strong>Room:</strong> 201<br />
                    <strong>Stay:</strong> 3 nights
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span>Room Charges</span>
                      <span>₦45,000.00</span>
                    </div>
                    {selectedTemplate.content.showVATBreakdown && (
                      <div className="flex justify-between mb-2 text-sm">
                        <span>VAT (7.5%)</span>
                        <span>₦3,375.00</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t pt-2">
                      <span>Total</span>
                      <span>₦48,375.00</span>
                    </div>
                  </div>

                  {selectedTemplate.content.showQRCode && (
                    <div className="text-center mt-6">
                      <div className="w-20 h-20 bg-gray-200 mx-auto mb-2" />
                      <p className="text-xs">Scan for digital receipt</p>
                    </div>
                  )}

                  {selectedTemplate.branding.footerText && (
                    <div className="text-center text-sm mt-6 italic">
                      {selectedTemplate.branding.footerText}
                    </div>
                  )}

                  {selectedTemplate.content.showStaffName && (
                    <div className="text-right text-xs mt-4">
                      Served by: John Smith
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}