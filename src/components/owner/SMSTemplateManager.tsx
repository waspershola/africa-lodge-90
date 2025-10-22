import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MessageSquare, Plus, Edit, Trash2 } from "lucide-react";
import { validateSMSTemplate, getCharacterCountColor, getSMSCountBadgeVariant, formatSMSCountText } from "@/lib/sms-validation";

interface SMSTemplate {
  id: string;
  template_name: string;
  event_type: string;
  message_template: string;
  is_active: boolean;
  tenant_id: string | null;
}

export function SMSTemplateManager() {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [formData, setFormData] = useState({
    template_name: "",
    event_type: "request_received",
    message_template: "",
    is_active: true,
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["sms-templates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("sms_templates")
        .select("*")
        .eq("tenant_id", user.id)
        .order("event_type");

      if (error) throw error;
      return data as SMSTemplate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (template: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("sms_templates")
        .insert({ ...template, tenant_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("Template created");
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (template: SMSTemplate) => {
      const { error } = await supabase
        .from("sms_templates")
        .update({
          template_name: template.template_name,
          message_template: template.message_template,
          is_active: template.is_active,
        })
        .eq("id", template.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("Template updated");
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sms_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
      toast.success("Template deleted");
    },
  });

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      template_name: "",
      event_type: "request_received",
      message_template: "",
      is_active: true,
    });
  };

  const handleEdit = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      event_type: template.event_type,
      message_template: template.message_template,
      is_active: template.is_active,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      updateMutation.mutate({ ...editingTemplate, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const validation = validateSMSTemplate(formData.message_template);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Template Manager
          </CardTitle>
          <CardDescription>
            Create templates for automated SMS notifications. Use placeholders: {"{hotel}"}, {"{guest_name}"}, {"{request_type}"}, {"{tracking_number}"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template_name">Template Name</Label>
                <Input
                  id="template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g., Request Confirmation"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event_type">Event Type</Label>
                <select
                  id="event_type"
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="request_received">Request Received</option>
                  <option value="request_completed">Request Completed</option>
                  <option value="request_cancelled">Request Cancelled</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message_template">Message Template</Label>
              <Textarea
                id="message_template"
                value={formData.message_template}
                onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                placeholder="Hello {guest_name}, your {request_type} request at {hotel} has been received. Track: {tracking_number}"
                rows={4}
                required
              />
              <div className="flex items-center justify-between text-sm">
                <span className={getCharacterCountColor(validation)}>
                  {validation.characterCount} chars
                </span>
                <Badge variant={getSMSCountBadgeVariant(validation)}>
                  {formatSMSCountText(validation)}
                </Badge>
              </div>
              {validation.warningMessage && (
                <div className="text-sm text-muted-foreground">
                  {validation.warningMessage}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Enabled</Label>
              </div>
              <div className="flex gap-2">
                {editingTemplate && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
                <Button type="submit">
                  {editingTemplate ? "Update" : "Create"} Template
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{template.event_type}</Badge>
                    {template.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{template.message_template}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
