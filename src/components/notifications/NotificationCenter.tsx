import { useState } from 'react';
import { Bell, Volume2, VolumeX, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useStaffNotifications } from '@/hooks/useStaffNotifications';
import { soundManager } from '@/utils/soundManager';
import { NotificationList } from './NotificationList';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { NotificationPermissionDialog } from './NotificationPermissionDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const {
    hasPermission,
    showPrompt,
    requestPermission,
    denyPermission,
  } = useNotificationPermission();
  
  const {
    notifications,
    unreadCount,
    isLoading,
    acknowledgeNotification,
    completeNotification,
    markAllAsRead
  } = useStaffNotifications({
    playSound: !isMuted,
    showToast: true
  });

  const handleToggleMute = () => {
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
  };

  return (
    <>
      <NotificationPermissionDialog
        open={showPrompt}
        onAccept={requestPermission}
        onDeny={denyPermission}
      />
      
      <div className="flex items-center gap-2">
        <NetworkStatusIndicator />
        
        <TooltipProvider>
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                        variant="destructive"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                    {!hasPermission && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full border-2 border-background flex items-center justify-center">
                        <BellOff className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </Button>
                </SheetTrigger>
              </TooltipTrigger>
              {!hasPermission && (
                <TooltipContent>
                  <p>Sounds disabled - Click to enable</p>
                </TooltipContent>
              )}
            </Tooltip>
        
            <SheetContent className="w-80 sm:w-96 flex flex-col">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle>Notifications</SheetTitle>
                  <div className="flex items-center gap-2">
                    {!hasPermission && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={requestPermission}
                        className="text-xs"
                      >
                        Enable Sounds
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleMute}
                      className="h-8 w-8 p-0"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                </div>
              </SheetHeader>
              
              <NotificationList
                notifications={notifications}
                isLoading={isLoading}
                onAcknowledge={acknowledgeNotification}
                onComplete={completeNotification}
              />
            </SheetContent>
          </Sheet>
        </TooltipProvider>
      </div>
    </>
  );
}