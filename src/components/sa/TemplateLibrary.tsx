import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Edit3, 
  Users, 
  Settings,
  Sparkles,
  Building2,
  Coffee,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTemplates, useCreateTemplate } from '@/hooks/useApi';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';

export default function TemplateLibrary() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const { data: templatesData, isLoading, error, refetch } = useTemplates();
  const createTemplate = useCreateTemplate();

  const availableFeatures = [
    'spa', 'concierge', 'valet', 'meeting-rooms', 'business-center', 
    'personalized-service', 'unique-design', 'restaurant', 'bar', 'gym'
  ];

  const handleCreate = async () => {
    if (!name.trim() || !category.trim()) return;
    
    await createTemplate.mutateAsync({
      name: name.trim(),
      category: category.trim(),
      features: selectedFeatures
    });
    
    setName('');
    setCategory('');
    setSelectedFeatures([]);
    setIsOpen(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'resort': return Sparkles;
      case 'business': return Briefcase;
      case 'boutique': return Coffee;
      default: return Building2;
    }
  };

  if (isLoading) return <LoadingState message="Loading templates..." />;
  if (error) return <ErrorState message="Failed to load templates" onRetry={refetch} />;

  const templates = templatesData?.data || [];

  return (
    <Card className="modern-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            Template Library
          </CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="btn-modern">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Template Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Resort">Resort</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Boutique">Boutique</SelectItem>
                      <SelectItem value="Budget">Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Features</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availableFeatures.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={feature}
                          checked={selectedFeatures.includes(feature)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFeatures([...selectedFeatures, feature]);
                            } else {
                              setSelectedFeatures(selectedFeatures.filter(f => f !== feature));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={feature} className="text-xs capitalize">
                          {feature.replace('-', ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={!name.trim() || !category.trim() || createTemplate.isPending}
                    className="flex-1 btn-modern"
                  >
                    {createTemplate.isPending ? 'Creating...' : 'Create Template'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No templates created yet
            </div>
          ) : (
            templates.map((template: any) => {
              const CategoryIcon = getCategoryIcon(template.category);
              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <CategoryIcon className="h-8 w-8 text-accent bg-accent/10 p-1.5 rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {template.usage} hotels using
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(template.features || []).slice(0, 3).map((feature: string) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature.replace('-', ' ')}
                        </Badge>
                      ))}
                      {(template.features || []).length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(template.features || []).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}