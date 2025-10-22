import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Volume2 } from 'lucide-react';

interface NotificationPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnable: () => void;
}

export function NotificationPermissionDialog({
  open,
  onOpenChange,
  onEnable,
}: NotificationPermissionDialogProps) {
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Check if user has already granted notification permission
    const hasPermission = localStorage.getItem('notification_permission_granted');
    if (hasPermission === 'true') {
      onOpenChange(false);
    }
  }, [onOpenChange]);

  const handleEnable = () => {
    setHasInteracted(true);
    localStorage.setItem('notification_permission_granted', 'true');
    onEnable();
    onOpenChange(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notification_permission_dismissed', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            Enable Sound Notifications
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-4">
            <p>
              Stay updated with real-time guest requests and messages with sound alerts.
            </p>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <strong>Why enable sound?</strong>
                  <p className="text-muted-foreground mt-1">
                    You'll hear an audible alert when guests send new requests or messages, 
                    ensuring you never miss important communications.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Browsers require a user action to play sounds. Click "Enable" to allow notifications.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mt-4">
          <Button
            onClick={handleEnable}
            className="flex-1"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enable Notifications
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
