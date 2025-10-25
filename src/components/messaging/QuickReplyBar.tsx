// @ts-nocheck
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface QuickReplyBarProps {
  requestType: string;
  onSelectTemplate: (text: string) => void;
  tenantId?: string;
}

interface MessageTemplate {
  id: string;
  template_key: string;
  template_text: string;
  category: string;
  request_types: string[];
}

export function QuickReplyBar({ requestType, onSelectTemplate, tenantId }: QuickReplyBarProps) {
  // Fetch message templates for this request type (server-side filtering)
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['message-templates', tenantId, requestType],
    queryFn: async () => {
      if (!tenantId) return [];

      // Use Supabase .contains() for server-side filtering
      // This queries where request_types array contains either 'all' or the specific requestType
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .contains('request_types', [requestType])
        .order('sort_order', { ascending: true });

      if (error) {
        // If the specific type query fails, try fetching 'all' templates as fallback
        const { data: allData, error: allError } = await supabase
          .from('message_templates')
          .select('*')
          .eq('tenant_id', tenantId)
          .eq('is_active', true)
          .contains('request_types', ['all'])
          .order('sort_order', { ascending: true });
        
        if (allError) throw allError;
        return allData as MessageTemplate[];
      }

      return (data || []) as MessageTemplate[];
    },
    enabled: !!tenantId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="border-b bg-muted/30 p-2">
      <p className="text-xs text-muted-foreground mb-2 px-1">Quick Replies:</p>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {templates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              onClick={() => onSelectTemplate(template.template_text)}
              className="whitespace-nowrap text-xs h-7 bg-background hover:bg-primary/5"
            >
              {template.template_text.length > 40
                ? template.template_text.substring(0, 40) + '...'
                : template.template_text}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
