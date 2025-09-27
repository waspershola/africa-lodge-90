import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Eye } from "lucide-react";
import { toast } from "sonner";

interface SMSTemplate {
  id: string;
  template_name: string;
  event_type: string;
  message_template: string;
  is_active: boolean;
  is_global: boolean;
  allow_tenant_override: boolean;
  variables: string[];
  created_at: string;
  updated_at: string;
}

export function GlobalTemplates() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<SMSTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('is_global', true)
        .order('event_type');

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        variables: Array.isArray(template.variables) 
          ? (template.variables as string[])
          : typeof template.variables === 'string' 
            ? [template.variables] 
            : []
      })));
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error("Failed to load SMS templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (template: Partial<SMSTemplate>) => {
    try {
      if (editingTemplate?.id) {
        // Update existing template
        const { error } = await supabase
          .from('sms_templates')
          .update(template)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success("Template updated successfully");
      } else {
        // Create new template
        const { error } = await supabase
          .from('sms_templates')
          .insert({
            template_name: template.template_name || '',
            event_type: template.event_type || '',
            message_template: template.message_template || '',
            allow_tenant_override: template.allow_tenant_override,
            variables: template.variables,
            is_active: template.is_active,
            is_global: true
          });

        if (error) throw error;
        toast.success("Template created successfully");
      }

      fetchTemplates();
      setIsDialogOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error("Failed to save template");
    }
  };

  const toggleTemplate = async (templateId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .update({ is_active: isActive })
        .eq('id', templateId);

      if (error) throw error;
      
      fetchTemplates();
      toast.success(`Template ${isActive ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error("Failed to update template status");
    }
  };

  const renderPreview = (template: SMSTemplate) => {
    let preview = template.message_template;
    template.variables.forEach((variable) => {
      const placeholder = `{${variable}}`;
      const sampleValue = getSampleValue(variable);
      preview = preview.replace(new RegExp(placeholder, 'g'), sampleValue);
    });
    return preview;
  };

  const getSampleValue = (variable: string) => {
    const sampleValues: { [key: string]: string } = {
      'guest_name': 'John Doe',
      'hotel_name': 'Grand Plaza Hotel',
      'room_type': 'Deluxe Suite',
      'check_in_date': '2025-01-15',
      'check_out_date': '2025-01-18',
      'reservation_number': 'RES-20250115-0001',
      'amount': '125,000',
      'currency': '₦',
      'payment_reference': 'PAY-123456789',
      'room_number': '205',
      'service_type': 'Room Cleaning',
      'message': 'Please clean the room',
      'check_in_time': '2:00 PM',
      'credits_remaining': '45'
    };
    return sampleValues[variable] || `[${variable}]`;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Global SMS Templates</h2>
          <p className="text-muted-foreground">
            Manage global SMS templates that hotels can customize
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </DialogTitle>
              <DialogDescription>
                Create or modify a global SMS template
              </DialogDescription>
            </DialogHeader>
            <TemplateForm 
              template={editingTemplate} 
              onSave={handleSaveTemplate}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Templates</CardTitle>
          <CardDescription>
            Global templates that can be customized by individual hotels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Editable by Hotels</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.template_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{template.event_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-sm">
                      {template.message_template.substring(0, 50)}...
                    </div>
                  </TableCell>
                  <TableCell>
                    {template.allow_tenant_override ? (
                      <Badge>Yes</Badge>
                    ) : (
                      <Badge variant="secondary">No</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(template.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPreviewTemplate(template);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of {previewTemplate?.template_name}
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Event Type</Label>
                <Badge className="ml-2">{previewTemplate.event_type}</Badge>
              </div>
              <div>
                <Label>Message Template</Label>
                <div className="p-3 bg-muted rounded-md text-sm font-mono">
                  {previewTemplate.message_template}
                </div>
              </div>
              <div>
                <Label>Sample Output</Label>
                <div className="p-3 bg-blue-50 rounded-md text-sm">
                  {renderPreview(previewTemplate)}
                </div>
              </div>
              <div>
                <Label>Variables</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {previewTemplate.variables.map((variable) => (
                    <Badge key={variable} variant="outline">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateForm({ 
  template, 
  onSave, 
  onCancel 
}: { 
  template: SMSTemplate | null;
  onSave: (template: Partial<SMSTemplate>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    template_name: template?.template_name || '',
    event_type: template?.event_type || '',
    message_template: template?.message_template || '',
    allow_tenant_override: template?.allow_tenant_override ?? true,
    variables: template?.variables || [],
    is_active: template?.is_active ?? true
  });

  const extractVariables = (text: string) => {
    const matches = text.match(/\{([^}]+)\}/g);
    if (matches) {
      return matches.map(match => match.slice(1, -1));
    }
    return [];
  };

  const handleMessageChange = (message: string) => {
    const variables = extractVariables(message);
    setFormData({
      ...formData,
      message_template: message,
      variables
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="template_name">Template Name</Label>
        <Input
          id="template_name"
          value={formData.template_name}
          onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
          placeholder="Booking Confirmation"
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="event_type">Event Type</Label>
        <Input
          id="event_type"
          value={formData.event_type}
          onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
          placeholder="booking_confirmed"
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="message_template">Message Template</Label>
        <Textarea
          id="message_template"
          rows={4}
          value={formData.message_template}
          onChange={(e) => handleMessageChange(e.target.value)}
          placeholder="Hi {guest_name}, your booking at {hotel_name} is confirmed..."
        />
        <p className="text-xs text-muted-foreground">
          Use {"{variable_name}"} for dynamic content. Variables will be extracted automatically.
        </p>
      </div>

      {formData.variables.length > 0 && (
        <div>
          <Label>Detected Variables</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.variables.map((variable) => (
              <Badge key={variable} variant="outline">
                {variable}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="allow_tenant_override"
          checked={formData.allow_tenant_override}
          onCheckedChange={(checked) => setFormData({ ...formData, allow_tenant_override: checked })}
        />
        <Label htmlFor="allow_tenant_override">Allow hotels to customize this template</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active template</Label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(formData)}>
          Save Template
        </Button>
      </DialogFooter>
    </div>
  );
}