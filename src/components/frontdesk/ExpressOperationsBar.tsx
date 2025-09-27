import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  LogIn, 
  LogOut, 
  CreditCard, 
  UserPlus, 
  Volume2, 
  VolumeX,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useState } from 'react';
import { oneClickOperations } from '@/services/OneClickOperations';
import { audioNotificationService } from '@/services/AudioNotificationService';
import { useToast } from '@/hooks/use-toast';

interface ExpressOperationsBarProps {
  onAction?: (action: string) => void;
  connectionStatus?: { isOnline: boolean; syncInProgress: boolean };
}

export function ExpressOperationsBar({ onAction, connectionStatus }: ExpressOperationsBarProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { toast } = useToast();

  const handleExpressCheckIn = async () => {
    toast({
      title: "Express Check-In",
      description: "Opening express check-in dialog...",
    });
    onAction?.('express-checkin');
  };

  const handleLightningCheckOut = async () => {
    toast({
      title: "Lightning Check-Out", 
      description: "Opening lightning checkout dialog...",
    });
    onAction?.('lightning-checkout');
  };

  const handleSmartPayment = async () => {
    toast({
      title: "Smart Payment",
      description: "Opening payment collection dialog...",
    });
    onAction?.('smart-payment');
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    
    if (newState) {
      audioNotificationService.setMasterVolume(1.0);
      audioNotificationService.testSound('general');
    } else {
      audioNotificationService.setMasterVolume(0.0);
    }
    
    toast({
      title: newState ? "Sound Enabled" : "Sound Disabled",
      description: newState ? "Audio alerts are now active" : "Audio alerts are muted",
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {connectionStatus?.isOnline ? (
              <Badge className="bg-success/10 text-success border-success/20">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge className="bg-warning/10 text-warning-foreground border-warning/20">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            
            {connectionStatus?.syncInProgress && (
              <Badge className="bg-blue-100 text-blue-800">
                Syncing...
              </Badge>
            )}
          </div>

          {/* Express Operations */}
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleExpressCheckIn}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
            >
              <Zap className="h-4 w-4 mr-2" />
              Express Check-In
            </Button>
            
            <Button
              onClick={handleLightningCheckOut}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Lightning Checkout
            </Button>
            
            <Button
              onClick={handleSmartPayment}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Smart Pay
            </Button>

            {/* Audio Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSound}
              className={soundEnabled ? 'border-success text-success' : 'border-muted-foreground'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}