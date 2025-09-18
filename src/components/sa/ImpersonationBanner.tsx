import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, X, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ImpersonationSession {
  userId: string;
  userEmail: string;
  tenantId: string;
  tenantName: string;
  startTime: string;
  expiresAt: string;
  reason: string;
}

interface ImpersonationBannerProps {
  session: ImpersonationSession | null;
  onStop: () => void;
}

export default function ImpersonationBanner({ session, onStop }: ImpersonationBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (!session) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expires = new Date(session.expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        toast({
          title: 'Impersonation Session Expired',
          description: 'Your impersonation session has expired and will be terminated.',
          variant: 'destructive',
        });
        onStop();
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [session, onStop, toast]);

  if (!session) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-warning/90 to-danger/90 backdrop-blur-md border-b border-warning/20 shadow-lg"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-white/20 rounded-full">
                  <UserCheck className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-white animate-pulse" />
                  <span className="font-semibold text-white">
                    IMPERSONATING USER
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-white/90">
                <div className="text-sm">
                  <span className="font-medium">{session.userEmail}</span>
                  <span className="text-white/70"> at </span>
                  <span className="font-medium">{session.tenantName}</span>
                </div>
                
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Reason: {session.reason}
                </Badge>
                
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-3 w-3" />
                  <span className="font-mono">{timeRemaining}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={onStop}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 hover:border-white/50"
              >
                <X className="h-4 w-4 mr-2" />
                Stop Impersonation
              </Button>
            </div>
          </div>

          {/* Mobile view */}
          <div className="sm:hidden mt-2 pt-2 border-t border-white/20">
            <div className="flex items-center justify-between text-xs text-white/90">
              <span>{session.userEmail}</span>
              <div className="flex items-center gap-2">
                <span>{timeRemaining}</span>
                <span>•</span>
                <span>{session.reason}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}