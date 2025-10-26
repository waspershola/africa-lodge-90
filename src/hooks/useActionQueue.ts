import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { supabase } from '@/integrations/supabase/client';

export interface QueuedAction {
  id: string;
  type: 'checkin' | 'checkout' | 'payment' | 'assign' | 'maintenance';
  roomNumber: string;
  guest?: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

export const useActionQueue = () => {
  const { user, tenant } = useAuth();
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [isRetrying, setIsRetrying] = useState(false);

  // Load queued actions from localStorage on mount
  useEffect(() => {
    const loadStoredActions = () => {
      try {
        const stored = localStorage.getItem(`frontdesk-action-queue-${tenant?.tenant_id}`);
        if (stored) {
          const parsedActions = JSON.parse(stored).map((action: any) => ({
            ...action,
            timestamp: new Date(action.timestamp)
          }));
          setQueuedActions(parsedActions);
        }
      } catch (error) {
        console.error('Failed to load stored actions:', error);
      }
    };

    if (tenant?.tenant_id) {
      loadStoredActions();
    }
  }, [tenant?.tenant_id]);

  // Save queued actions to localStorage whenever they change
  useEffect(() => {
    if (tenant?.tenant_id && queuedActions.length >= 0) {
      try {
        localStorage.setItem(
          `frontdesk-action-queue-${tenant.tenant_id}`, 
          JSON.stringify(queuedActions)
        );
      } catch (error) {
        console.error('Failed to save queued actions:', error);
      }
    }
  }, [queuedActions, tenant?.tenant_id]);

  const addToQueue = (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3
    };

    setQueuedActions(prev => [...prev, queuedAction]);
  };

  const retryAction = async (actionId: string) => {
    setQueuedActions(prev => prev.map(action => 
      action.id === actionId 
        ? { ...action, status: 'processing' as const, retryCount: action.retryCount + 1 }
        : action
    ));

    try {
      // Simulate API retry - in real implementation, this would call actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success/failure based on retry count
      const action = queuedActions.find(a => a.id === actionId);
      const success = Math.random() > (0.2 * (action?.retryCount || 0)); // Higher success rate on retries
      
      setQueuedActions(prev => prev.map(action => 
        action.id === actionId 
          ? { 
              ...action, 
              status: success ? 'completed' : 'failed',
            }
          : action
      ));

      return success;
    } catch (error) {
      setQueuedActions(prev => prev.map(action => 
        action.id === actionId 
          ? { ...action, status: 'failed' as const }
          : action
      ));
      return false;
    }
  };

  const retryAll = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    const actionsToRetry = queuedActions.filter(
      action => (action.status === 'pending' || action.status === 'failed') 
        && action.retryCount < action.maxRetries
    );

    for (const action of actionsToRetry) {
      await retryAction(action.id);
      // Small delay between retries
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRetrying(false);
  };

  const removeAction = (actionId: string) => {
    setQueuedActions(prev => prev.filter(action => action.id !== actionId));
  };

  const clearCompleted = () => {
    setQueuedActions(prev => prev.filter(action => action.status !== 'completed'));
  };

  const clearAll = () => {
    setQueuedActions([]);
  };

  return {
    queuedActions,
    isRetrying,
    addToQueue,
    retryAction,
    retryAll,
    removeAction,
    clearCompleted,
    clearAll
  };
};