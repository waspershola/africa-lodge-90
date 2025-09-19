import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Users, 
  CreditCard, 
  QrCode, 
  X,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/components/auth/MultiTenantAuthProvider';
import { useNavigate } from 'react-router-dom';

interface WelcomeBannerProps {
  onDismiss?: () => void;
  className?: string;
}

const quickActions = [
  {
    id: 'invite-staff',
    title: 'Invite Your Staff',
    description: 'Add managers, front desk, and housekeeping staff',
    icon: Users,
    color: 'bg-blue-500',
    route: '/owner-dashboard/staff',
  },
  {
    id: 'setup-pos',
    title: 'Configure POS System',
    description: 'Set up payment methods and restaurant menus',
    icon: CreditCard,
    color: 'bg-green-500',
    route: '/owner-dashboard/financials',
  },
  {
    id: 'qr-services',
    title: 'Setup QR Services',
    description: 'Enable guest room service and maintenance requests',
    icon: QrCode,
    color: 'bg-purple-500',
    route: '/owner-dashboard/qr-manager',
  },
];

export function WelcomeBanner({ onDismiss, className }: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const { user, tenant } = useAuth();
  const navigate = useNavigate();

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
    // Store dismissal in localStorage
    localStorage.setItem(`welcome_banner_dismissed_${user?.id}`, 'true');
  };

  const handleQuickAction = (route: string) => {
    navigate(route);
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <Card className={`border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">
                🎉 Welcome to {tenant?.hotel_name || 'Your Hotel'}!
              </h3>
              <p className="text-green-700 text-sm mb-2">
                Your hotel management system is now configured and ready for business.
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Setup Complete
                </Badge>
                <Badge variant="outline" className="border-green-200 text-green-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {tenant?.subscription_status === 'trialing' ? 'Free Trial Active' : 'Subscribed'}
                </Badge>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div>
          <h4 className="font-medium text-green-800 mb-3">
            🚀 Recommended Next Steps:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.route)}
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200 hover:border-green-300 hover:shadow-sm transition-all text-left group"
              >
                <div className={`rounded-full p-2 ${action.color}`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {action.description}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-green-700">
              💡 <strong>Tip:</strong> Start by inviting your key staff members to get them familiar with the system.
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/owner-dashboard/configuration')}
              className="border-green-200 text-green-700 hover:bg-green-50"
            >
              View All Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}