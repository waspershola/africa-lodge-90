import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Building2, Building, Warehouse, FileSpreadsheet } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';

interface TemplateSelectionStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

const templates = [
  {
    id: 'boutique',
    name: 'Boutique Hotel',
    description: 'Perfect for intimate hotels with personalized service',
    roomCount: '≤25 rooms',
    maxRooms: 25,
    icon: Building2,
    features: ['Luxury amenities', 'Personalized service', 'Premium branding'],
    recommended: false,
  },
  {
    id: 'midsize',
    name: 'Mid-size Hotel',
    description: 'Ideal for growing hotels with diverse room types',
    roomCount: '26-75 rooms',
    maxRooms: 75,
    icon: Building,
    features: ['Multiple room categories', 'Restaurant integration', 'Event spaces'],
    recommended: true,
  },
  {
    id: 'large',
    name: 'Large Hotel',
    description: 'Full-service hotels with extensive facilities',
    roomCount: '75+ rooms',
    maxRooms: 500,
    icon: Warehouse,
    features: ['Multiple departments', 'Conference facilities', 'Full POS integration'],
    recommended: false,
  },
];

export function TemplateSelectionStep({ data, updateData }: TemplateSelectionStepProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [showCsvUpload, setShowCsvUpload] = useState(false);

  const selectTemplate = (template: typeof templates[0]) => {
    updateData({
      template: {
        id: template.id,
        name: template.name,
        roomCount: template.maxRooms,
        description: template.description,
      },
    });
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Choose Your Hotel Template</h3>
        <p className="text-muted-foreground mb-6">
          Select a template that best matches your hotel size and type. You can customize everything later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              data.template?.id === template.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => selectTemplate(template)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <template.icon className="h-8 w-8 text-primary" />
                {template.recommended && (
                  <Badge variant="default" className="text-xs">
                    Recommended
                  </Badge>
                )}
              </div>
              
              <h4 className="font-semibold mb-2">{template.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Room Capacity:</span>
                  <span className="text-muted-foreground">{template.roomCount}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Key Features:
                </p>
                {template.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-primary rounded-full"></div>
                    <span className="text-xs text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.template && (
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="text-center">
              <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">Optional: Import Room Layout</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a CSV file with your room numbers, types, and floors to speed up setup
              </p>
              
              {!showCsvUpload ? (
                <Button
                  variant="outline"
                  onClick={() => setShowCsvUpload(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Room Layout
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csvUpload">Room Layout CSV File</Label>
                    <Input
                      id="csvUpload"
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: Room Number, Room Type, Floor, Status
                    </p>
                  </div>
                  
                  {csvFile && (
                    <div className="text-sm text-green-600">
                      ✓ File uploaded: {csvFile.name}
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCsvUpload(false);
                        setCsvFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button disabled={!csvFile}>
                      Process File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}