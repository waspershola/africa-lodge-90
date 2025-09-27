import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Edit, Trash2, Plus, AlertTriangle } from "lucide-react";
import { SMSTemplateForm } from "@/components/ui/sms-template-form";
import { extractPlaceholders, validateSMSTemplate } from "@/lib/sms-validation";

interface SMSTemplate {
  id: string;
  template_name: string;
  event_type: string;
  message_template: string;
  variables: any; // Changed from string[] to any to handle Json type
  is_active: boolean;
  created_at: string;
  estimated_sms_count?: number;
  character_count_warning?: boolean;
}

const eventTypes = [
  { value: 'booking_confirmation', label: 'Booking Confirmation' },
  { value: 'check_in_reminder', label: 'Check-in Reminder' },
  { value: 'check_out_reminder', label: 'Check-out Reminder' },
  { value: 'payment_reminder', label: 'Payment Reminder' },
  { value: 'booking_cancelled', label: 'Booking Cancelled' },
  { value: 'qr_order_confirmation', label: 'QR Order Confirmation' },
  { value: 'qr_order_ready', label: 'QR Order Ready' },
  { value: 'maintenance_alert', label: 'Maintenance Alert' }
];

export function HotelSMSTemplates() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .eq('tenant_id', userData.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load SMS templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (formData: FormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      const messageTemplateValue = formData.get('message_template') as string;
      const validation = validateSMSTemplate(messageTemplateValue);
      const variables = extractPlaceholders(messageTemplateValue);

      const templateData = {
        tenant_id: userData.tenant_id,
        template_name: formData.get('template_name') as string,
        event_type: formData.get('event_type') as string,
        message_template: messageTemplateValue,
        variables: variables,
        is_active: true,
        estimated_sms_count: validation.estimatedSmsCount,
        character_count_warning: validation.hasWarning
      };

      if (editingTemplate?.id) {
        const { error } = await supabase
          .from('sms_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast({ title: "Success", description: "Template updated successfully" });
      } else {
        const { error } = await supabase
          .from('sms_templates')
          .insert([templateData]);

        if (error) throw error;
        toast({ title: "Success", description: "Template created successfully" });
      }

      setDialogOpen(false);
      setEditingTemplate(null);
      setMessageTemplate('');
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Success", description: "Template deleted successfully" });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const toggleTemplateStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('sms_templates')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast({ 
        title: "Success", 
        description: `Template ${!currentStatus ? 'activated' : 'deactivated'} successfully` 
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error updating template status:', error);
      toast({
        title: "Error",
        description: "Failed to update template status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">SMS Templates</h2>
          <p className="text-muted-foreground">Manage your hotel's SMS templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (open) {
            setMessageTemplate(editingTemplate?.message_template || '');
          } else {
            setEditingTemplate(null);
            setMessageTemplate('');
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
              <DialogDescription>
                Create or edit SMS templates for automated notifications
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              formData.set('message_template', messageTemplate);
              handleSaveTemplate(formData);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template_name">Template Name</Label>
                  <Input
                    id="template_name"
                    name="template_name"
                    defaultValue={editingTemplate?.template_name || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select name="event_type" defaultValue={editingTemplate?.event_type || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Enhanced SMS Template Form with Real-time Validation */}
              <SMSTemplateForm
                value={messageTemplate}
                onChange={setMessageTemplate}
                placeholder="Enter your SMS template with variables like {guest}, {hotel}, {room}"
              />
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingTemplate ? 'Update' : 'Create'} Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first SMS template to start sending automated notifications
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {template.template_name}
                      <Badge variant={template.is_active ? 'default' : 'secondary'}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {template.character_count_warning && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {template.estimated_sms_count || 2} SMS
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {eventTypes.find(t => t.value === template.event_type)?.label || template.event_type}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTemplateStatus(template.id, template.is_active)}
                    >
                      {template.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setMessageTemplate(template.message_template);
                        setDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Message:</Label>
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                      {template.message_template}
                    </p>
                  </div>
                  {template.variables?.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Variables:</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Array.isArray(template.variables) 
                          ? template.variables.map((variable, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {variable}
                              </Badge>
                            ))
                          : template.variables && typeof template.variables === 'object' && Array.isArray(template.variables)
                            ? template.variables.map((variable: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {variable}
                                </Badge>
                              ))
                            : null
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}