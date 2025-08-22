import { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '@/hooks/useApi';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

const Templates = () => {
  const { data: templates, isLoading, error } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  const handleCreateEdit = (template?: any) => {
    setSelectedTemplate(template || {
      name: '',
      category: '',
      description: '',
      roomTypes: [],
      pricingRules: { taxRate: 7.5, serviceCharge: 10, seasonalMarkup: 15 },
      branding: { primaryColor: '#8B0000', accentColor: '#FFD700' },
      features: []
    });
    setDialogMode(template ? 'edit' : 'create');
    setIsDialogOpen(true);
  };

  const handleView = (template: any) => {
    setSelectedTemplate(template);
    setDialogMode('view');
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      category: formData.get('category'),
      description: formData.get('description'),
      roomTypes: selectedTemplate.roomTypes,
      pricingRules: selectedTemplate.pricingRules,
      branding: selectedTemplate.branding,
      features: selectedTemplate.features
    };

    if (dialogMode === 'edit') {
      updateTemplate.mutate({ id: selectedTemplate.id, data });
    } else {
      createTemplate.mutate(data);
    }
    setIsDialogOpen(false);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Luxury': 'bg-purple-100 text-purple-800',
      'Boutique': 'bg-blue-100 text-blue-800',
      'Budget': 'bg-green-100 text-green-800',
      'Resort': 'bg-orange-100 text-orange-800',
      'Business': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Hotel Templates</h1>
          <p className="text-muted-foreground">Manage hotel customization templates for new tenants</p>
        </div>
        <Button onClick={() => handleCreateEdit()} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.data?.map((template: any) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Badge className={getCategoryColor(template.category)}>
                    {template.category}
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => handleView(template)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleCreateEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteTemplate.mutate(template.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {template.description}
              </CardDescription>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room Types:</span>
                  <span className="font-medium">{template.roomTypes?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Features:</span>
                  <span className="font-medium">{template.features?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax Rate:</span>
                  <span className="font-medium">{template.pricingRules?.taxRate}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Create Template' : 
               dialogMode === 'edit' ? 'Edit Template' : 'Template Details'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'view' ? 'View template configuration' : 
               'Configure hotel template settings and defaults'}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === 'view' ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rooms">Room Types</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Template Name</Label>
                    <p className="font-medium">{selectedTemplate?.name}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Badge className={getCategoryColor(selectedTemplate?.category)}>
                      {selectedTemplate?.category}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground">{selectedTemplate?.description}</p>
                </div>
                <div>
                  <Label>Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTemplate?.features?.map((feature: string, index: number) => (
                      <Badge key={index} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="rooms" className="space-y-4">
                {selectedTemplate?.roomTypes?.map((room: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{room.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Base Price</Label>
                          <p className="font-medium">₦{room.basePrice?.toLocaleString()}</p>
                        </div>
                        <div>
                          <Label>Amenities</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {room.amenities?.map((amenity: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{amenity}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tax Rate</Label>
                    <p className="font-medium">{selectedTemplate?.pricingRules?.taxRate}%</p>
                  </div>
                  <div>
                    <Label>Service Charge</Label>
                    <p className="font-medium">{selectedTemplate?.pricingRules?.serviceCharge}%</p>
                  </div>
                  <div>
                    <Label>Seasonal Markup</Label>
                    <p className="font-medium">{selectedTemplate?.pricingRules?.seasonalMarkup}%</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="branding" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: selectedTemplate?.branding?.primaryColor }}
                      />
                      <span className="font-mono text-sm">{selectedTemplate?.branding?.primaryColor}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: selectedTemplate?.branding?.accentColor }}
                      />
                      <span className="font-mono text-sm">{selectedTemplate?.branding?.accentColor}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={selectedTemplate?.name}
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={selectedTemplate?.category}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Luxury">Luxury</SelectItem>
                      <SelectItem value="Boutique">Boutique</SelectItem>
                      <SelectItem value="Budget">Budget</SelectItem>
                      <SelectItem value="Resort">Resort</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={selectedTemplate?.description}
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                  {dialogMode === 'edit' ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Templates;