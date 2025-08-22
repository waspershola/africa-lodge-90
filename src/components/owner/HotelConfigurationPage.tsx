import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Palette, 
  BedDouble, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Upload
} from "lucide-react";
import HotelProfileForm from "./config/HotelProfileForm";
import BrandingForm from "./config/BrandingForm";
import RoomSetupForm from "./config/RoomSetupForm";

const HotelConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(new Date().toLocaleTimeString());

  const handleSaveAll = () => {
    // Save all configuration data
    setUnsavedChanges(false);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const configSections = [
    {
      id: "profile",
      title: "Hotel Profile",
      description: "Basic hotel information and contact details",
      icon: Building2,
      status: "complete",
      progress: 100
    },
    {
      id: "branding", 
      title: "Branding & Theme",
      description: "Logo, colors, and visual identity",
      icon: Palette,
      status: "incomplete",
      progress: 60
    },
    {
      id: "rooms",
      title: "Room Setup", 
      description: "Room categories, amenities, and pricing",
      icon: BedDouble,
      status: "incomplete", 
      progress: 40
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-3xl font-bold text-gradient">
            Hotel Configuration
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up your hotel profile, branding, and room configurations
          </p>
        </div>
        <div className="flex items-center gap-4">
          {unsavedChanges && (
            <div className="flex items-center gap-2 text-warning">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Unsaved changes</span>
            </div>
          )}
          <div className="text-sm text-muted-foreground">
            Last saved: {lastSaved}
          </div>
          <Button 
            onClick={handleSaveAll}
            className="bg-gradient-primary"
            disabled={!unsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {configSections.map((section) => (
          <Card key={section.id} className="luxury-card cursor-pointer hover:shadow-hover" 
                onClick={() => setActiveTab(section.id)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  section.status === 'complete' 
                    ? 'bg-success/10 text-success' 
                    : 'bg-warning/10 text-warning-foreground'
                }`}>
                  <section.icon className="h-6 w-6" />
                </div>
                <Badge variant={section.status === 'complete' ? 'default' : 'secondary'}>
                  {section.status === 'complete' ? (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  ) : (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  )}
                  {section.progress}%
                </Badge>
              </div>
              <h3 className="font-playfair text-lg font-semibold mb-2">
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {section.description}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${section.progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Hotel Profile
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="rooms" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            Room Setup
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <HotelProfileForm onDataChange={() => setUnsavedChanges(true)} />
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <BrandingForm onDataChange={() => setUnsavedChanges(true)} />
        </TabsContent>

        <TabsContent value="rooms" className="space-y-6">
          <RoomSetupForm onDataChange={() => setUnsavedChanges(true)} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HotelConfigurationPage;