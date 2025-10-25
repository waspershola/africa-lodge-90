// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Eye, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Smartphone, 
  Mail, 
  MessageSquare,
  Save,
  RefreshCw
} from "lucide-react";

interface Template {
  id: string;
  template_name: string;
  message_template: string;
  variables: any;
  event_type: string;
  is_active: boolean;
  tenant_id: string;
}

interface PreviewData {
  [key: string]: string;
}

export function TemplatePreview() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData>({});
  const [previewContent, setPreviewContent] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      generatePreview();
    }
  }, [selectedTemplate, previewData]);

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
        .eq('is_active', true);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    if (!selectedTemplate) return;

    let content = selectedTemplate.message_template;
    const variables = Array.isArray(selectedTemplate.variables) 
      ? selectedTemplate.variables 
      : (selectedTemplate.variables as any)?.map?.((v: any) => typeof v === 'string' ? v : v.name) || [];

    // Replace variables with preview data
    variables.forEach((variable: string) => {
      const placeholder = `{{${variable}}}`;
      const value = previewData[variable] || `[${variable}]`;
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    setPreviewContent(content);
  };

  const sendTestMessage = async (channel: 'sms' | 'email') => {
    if (!selectedTemplate || !previewContent) return;

    if (channel === 'sms' && !testPhone) {
      toast({
        title: "Error",
        description: "Please enter a test phone number",
        variant: "destructive",
      });
      return;
    }

    if (channel === 'email' && !testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) return;

      // Create a test notification event
      const { error } = await supabase
        .from('notification_events')
        .insert({
          tenant_id: userData.tenant_id,
          event_type: 'template_test',
          event_source: 'system',
          source_id: 'template-test',
          template_data: {
            message: previewContent,
            template_name: selectedTemplate.template_name,
            test_recipient: channel === 'sms' ? testPhone : testEmail
          },
          recipients: [{
            type: 'staff',
            [channel === 'sms' ? 'phone' : 'email']: channel === 'sms' ? testPhone : testEmail
          }],
          channels: [channel],
          priority: 'low',
          scheduled_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Test ${channel} message sent successfully`,
      });
    } catch (error) {
      console.error('Error sending test message:', error);
      toast({
        title: "Error",
        description: `Failed to send test ${channel} message`,
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const updatePreviewData = (variable: string, value: string) => {
    setPreviewData(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const loadSampleData = () => {
    const sampleData: PreviewData = {
      guest_name: 'John Doe',
      hotel_name: 'Grand Hotel',
      room_number: '205',
      check_in_date: new Date().toLocaleDateString(),
      check_out_date: new Date(Date.now() + 86400000).toLocaleDateString(),
      reservation_number: 'RES-2024-001',
      total_amount: '15,000',
      phone_number: '+234 800 123 4567',
      payment_link: 'https://payment.hotel.com/pay/123',
      amount_due: '7,500',
      due_date: new Date(Date.now() + 86400000).toLocaleDateString()
    };

    setPreviewData(sampleData);
    toast({
      title: "Success",
      description: "Sample data loaded for preview",
    });
  };

  if (loading) {
    return <div className="text-center">Loading template preview...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Template Preview & Testing</h2>
          <p className="text-muted-foreground">
            Preview and test SMS/Email templates with real data
          </p>
        </div>
        <Button onClick={loadSampleData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Load Sample Data
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Template</CardTitle>
            <CardDescription>Choose a template to preview and test</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Template</Label>
                <Select 
                  onValueChange={(value) => {
                    const template = templates.find(t => t.id === value);
                    setSelectedTemplate(template || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                  {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <span>{template.template_name}</span>
                          <Badge variant="outline" className="ml-auto">
                            {template.event_type}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTemplate && (
                <div className="space-y-3">
                  <Separator />
                  <div>
                    <div className="text-sm font-medium">Event Type</div>
                    <Badge variant="secondary">{selectedTemplate.event_type}</Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Channel</div>
                    <div className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      <span className="capitalize">SMS</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-2">Variables ({Array.isArray(selectedTemplate.variables) 
                      ? selectedTemplate.variables.length 
                      : (selectedTemplate.variables as any)?.length || 0})</div>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(selectedTemplate.variables) 
                        ? selectedTemplate.variables 
                        : (selectedTemplate.variables as any)?.map?.((v: any) => typeof v === 'string' ? v : v.name) || []
                      ).map((variable: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Variable Input */}
        <Card>
          <CardHeader>
            <CardTitle>Template Variables</CardTitle>
            <CardDescription>Set values for template placeholders</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="space-y-4">
                {(Array.isArray(selectedTemplate.variables) 
                  ? selectedTemplate.variables 
                  : (selectedTemplate.variables as any)?.map?.((v: any) => typeof v === 'string' ? v : v.name) || []
                ).map((variable: string, index: number) => (
                  <div key={index}>
                    <Label htmlFor={variable}>{variable}</Label>
                    <Input
                      id={variable}
                      value={previewData[variable] || ''}
                      onChange={(e) => updatePreviewData(variable, e.target.value)}
                      placeholder={`Enter ${variable}...`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a template to see variables</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview & Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview & Test
            </CardTitle>
            <CardDescription>See how the message will look and send test messages</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate && previewContent ? (
              <div className="space-y-4">
                {/* Preview */}
                <div>
                  <Label className="text-sm font-medium">Message Preview</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg border">
                    <div className="text-sm whitespace-pre-wrap">{previewContent}</div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Character count: {previewContent.length}
                    {previewContent.length > 160 && (
                      <span className="text-orange-600 ml-2">
                        ({Math.ceil(previewContent.length / 160)} SMS parts)
                      </span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Test Controls */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Send Test Message</Label>
                    
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter test phone number..."
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                      />
                      <Button 
                        onClick={() => sendTestMessage('sms')} 
                        disabled={testLoading || !testPhone}
                        className="w-full"
                        size="sm"
                      >
                        <Smartphone className="mr-2 h-4 w-4" />
                        {testLoading ? 'Sending...' : 'Send Test SMS'}
                      </Button>
                    </div>
                  </div>

                {/* Template Quality Check */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Quality Check</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {previewContent.length <= 160 ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      }
                      <span className="text-sm">
                        {previewContent.length <= 160 ? 'Single SMS' : 'Multiple SMS parts'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(Array.isArray(selectedTemplate.variables) 
                        ? selectedTemplate.variables 
                        : (selectedTemplate.variables as any)?.map?.((v: any) => typeof v === 'string' ? v : v.name) || []
                      ).every((v: string) => previewData[v]) ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      }
                      <span className="text-sm">
                        {(Array.isArray(selectedTemplate.variables) 
                          ? selectedTemplate.variables 
                          : (selectedTemplate.variables as any)?.map?.((v: any) => typeof v === 'string' ? v : v.name) || []
                        ).every((v: string) => previewData[v]) ? 
                          'All variables filled' : 'Some variables missing'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Play className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a template and fill variables to see preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}