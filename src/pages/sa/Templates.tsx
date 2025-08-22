import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Plus, 
  Edit3, 
  Trash2, 
  Copy, 
  Star,
  Building,
  Gem,
  Briefcase,
  TreePine,
  DollarSign,
  Users,
  Crown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '@/hooks/useApi';
import { useToast } from '@/hooks/use-toast';

const templateCategories = [
  { id: 'boutique', name: 'Boutique', icon: Star, color: 'text-accent' },
  { id: 'luxury', name: 'Luxury', icon: Crown, color: 'text-primary' },
  { id: 'budget', name: 'Budget', icon: DollarSign, color: 'text-success' },
  { id: 'resort', name: 'Resort', icon: TreePine, color: 'text-warning' },
  { id: 'business', name: 'Business', icon: Briefcase, color: 'text-muted-foreground' },
];

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const { toast } = useToast();

  const { data: templatesData, isLoading, error, refetch } = useTemplates();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  if (isLoading) return <LoadingState message="Loading templates..." />;
  if (error) return <ErrorState message="Failed to load templates" onRetry={refetch} />;

  const templates = templatesData?.data || [];
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter((t: any) => t.category === selectedCategory);

  const handleCreateTemplate = async (data: any) => {
    try {
      await createTemplate.mutateAsync(data);
      toast({ title: "Template created successfully" });
      setCreateDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to create template", variant: "destructive" });
    }
  };

  const handleUpdateTemplate = async (data: any) => {
    try {
      await updateTemplate.mutateAsync({ id: selectedTemplate.id, ...data });
      toast({ title: "Template updated successfully" });
      setEditDialogOpen(false);
      setSelectedTemplate(null);
    } catch (error) {
      toast({ title: "Failed to update template", variant: "destructive" });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast({ title: "Template deleted successfully" });
    } catch (error) {
      toast({ title: "Failed to delete template", variant: "destructive" });
    }
  };

  const handleCloneTemplate = async (template: any) => {
    try {
      const clonedData = {
        ...template,
        name: `${template.name} (Copy)`,
        id: undefined
      };
      await createTemplate.mutateAsync(clonedData);
      toast({ title: "Template cloned successfully" });
    } catch (error) {
      toast({ title: "Failed to clone template", variant: "destructive" });
    }
  };

  return (
    <motion.div 
      className="space-y-8"
      initial="initial"
      animate="animate"
      variants={{
        animate: { transition: { staggerChildren: 0.1 } }
      }}
    >
      {/* Header */}
      <motion.div variants={fadeIn} className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold display-heading text-gradient">Hotel Templates</h1>
          <p className="text-muted-foreground mt-2">Manage customization templates for different hotel categories</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <TemplateForm onSubmit={handleCreateTemplate} />
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Category Filter */}
      <motion.div variants={fadeIn} className="flex gap-2 overflow-x-auto pb-2">
        <Button 
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedCategory('all')}
          className="whitespace-nowrap"
        >
          All Templates
        </Button>
        {templateCategories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(category.id)}
            className="whitespace-nowrap gap-2"
          >
            <category.icon className={`h-4 w-4 ${category.color}`} />
            {category.name}
          </Button>
        ))}
      </motion.div>

      {/* Templates Grid */}
      <motion.div variants={fadeIn} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template: any) => {
          const CategoryIcon = templateCategories.find(c => c.id === template.category)?.icon || Building;
          const categoryColor = templateCategories.find(c => c.id === template.category)?.color || 'text-muted-foreground';
          
          return (
            <Card key={template.id} className="modern-card hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CategoryIcon className={`h-5 w-5 ${categoryColor}`} />
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-success" />
                    <span>Markup: {template.pricing?.markup}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{template.roomTypes?.length || 0} room types</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Palette className="h-4 w-4 text-accent" />
                    <span>Theme: {template.branding?.theme || 'Default'}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setEditDialogOpen(true);
                    }}
                    className="flex-1 gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloneTemplate(template)}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Clone
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-danger hover:text-danger hover:bg-danger/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <TemplateForm 
              initialData={selectedTemplate}
              onSubmit={handleUpdateTemplate}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function TemplateForm({ initialData, onSubmit }: { initialData?: any; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || 'boutique',
    pricing: {
      markup: initialData?.pricing?.markup || 15,
      taxes: initialData?.pricing?.taxes || 8,
      serviceFees: initialData?.pricing?.serviceFees || 5
    },
    roomTypes: initialData?.roomTypes || [
      { name: 'Standard Room', basePrice: 100, amenities: ['WiFi', 'AC', 'TV'] }
    ],
    branding: {
      theme: initialData?.branding?.theme || 'modern',
      primaryColor: initialData?.branding?.primaryColor || '#1A237E',
      secondaryColor: initialData?.branding?.secondaryColor || '#FFD700'
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="rooms">Room Types</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Luxury Resort Template"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templateCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe this template..."
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="markup">Markup (%)</Label>
              <Input
                id="markup"
                type="number"
                value={formData.pricing.markup}
                onChange={(e) => setFormData({
                  ...formData, 
                  pricing: {...formData.pricing, markup: Number(e.target.value)}
                })}
              />
            </div>
            <div>
              <Label htmlFor="taxes">Taxes (%)</Label>
              <Input
                id="taxes"
                type="number"
                value={formData.pricing.taxes}
                onChange={(e) => setFormData({
                  ...formData, 
                  pricing: {...formData.pricing, taxes: Number(e.target.value)}
                })}
              />
            </div>
            <div>
              <Label htmlFor="serviceFees">Service Fees (%)</Label>
              <Input
                id="serviceFees"
                type="number"
                value={formData.pricing.serviceFees}
                onChange={(e) => setFormData({
                  ...formData, 
                  pricing: {...formData.pricing, serviceFees: Number(e.target.value)}
                })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Room types configuration will be expanded in future updates.
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select 
                value={formData.branding.theme} 
                onValueChange={(value) => setFormData({
                  ...formData, 
                  branding: {...formData.branding, theme: value}
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={formData.branding.primaryColor}
                onChange={(e) => setFormData({
                  ...formData, 
                  branding: {...formData.branding, primaryColor: e.target.value}
                })}
              />
            </div>
            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={formData.branding.secondaryColor}
                onChange={(e) => setFormData({
                  ...formData, 
                  branding: {...formData.branding, secondaryColor: e.target.value}
                })}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        <Button type="submit">
          {initialData ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}