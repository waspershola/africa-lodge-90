import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bell, Volume2 } from 'lucide-react';

interface NotificationPermissionDialogProps {
  open: boolean;
  onAccept: () => void;
  onDeny: () => void;
}

export function NotificationPermissionDialog({
  open,
  onAccept,
  onDeny,
}: NotificationPermissionDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="text-xl">
              Enable Notifications & Sounds
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 text-base">
            <p>
              Allow this app to play sounds and show notifications for:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <Volume2 className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>New guest service requests</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Important updates and alerts</span>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Status changes on assigned tasks</span>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              You can change this setting anytime in your preferences.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDeny}>
            Maybe Later
          </AlertDialogCancel>
          <AlertDialogAction onClick={onAccept}>
            Enable Sounds
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
