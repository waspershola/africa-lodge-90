import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface AuditTrailDisplayProps {
  roomId: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actor_email: string;
  actor_role: string;
  created_at: string;
  description: string;
}

export const AuditTrailDisplay = ({ roomId }: AuditTrailDisplayProps) => {
  const { user } = useAuth();
  const [lastAction, setLastAction] = useState<AuditEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLastAction = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_log')
          .select('id, action, actor_email, actor_role, created_at, description')
          .eq('resource_type', 'ROOM')
          .eq('resource_id', roomId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching audit trail:', error);
        } else if (data) {
          setLastAction(data);
        }
      } catch (error) {
        console.error('Error fetching audit trail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLastAction();
  }, [roomId]);

  if (loading) {
    return <p>Loading audit info...</p>;
  }

  if (!lastAction) {
    return <p>Last updated by {user?.email || 'System'} at {new Date().toLocaleTimeString()}</p>;
  }

  return (
    <div className="space-y-1">
      <p>
        Last {lastAction.action.toLowerCase()} by {lastAction.actor_email || 'System'} 
        {' '}({lastAction.actor_role || 'Unknown'})
      </p>
      <p className="text-xs">
        {formatDistanceToNow(new Date(lastAction.created_at))} ago
        {lastAction.description && ` • ${lastAction.description}`}
      </p>
    </div>
  );
};