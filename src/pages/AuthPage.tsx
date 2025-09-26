import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { useAuth } from '@/hooks/useMultiTenantAuth';
import { Loader2, Hotel, Shield, Star, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  
  const tab = searchParams.get('tab') || 'login';
  const inviteToken = searchParams.get('invite');
  const resetToken = searchParams.get('token');
  const [activeTab, setActiveTab] = useState(tab);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo);
    }
  }, [user, isLoading, navigate, searchParams]);

  // Set active tab from URL params
  useEffect(() => {
    if (resetToken) {
      setActiveTab('reset');
    } else if (inviteToken) {
      setActiveTab('signup');
    } else {
      setActiveTab(tab);
    }
  }, [tab, resetToken, inviteToken]);

  const handleAuthSuccess = () => {
    const redirectTo = searchParams.get('redirect') || '/dashboard';
    navigate(redirectTo);
  };

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Password reset flow
  if (resetToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-serif font-bold mb-2">Secure Reset</h1>
            <p className="text-muted-foreground">Complete your password reset</p>
          </div>
          
          <PasswordResetForm 
            token={resetToken}
            onSuccess={handleAuthSuccess}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-light mb-6 shadow-luxury">
              <Hotel className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Luxury Hotel Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline your operations with our comprehensive hotel management platform
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Tenant</h3>
              <p className="text-sm text-muted-foreground">
                Secure, isolated environments for each property
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Enterprise Security</h3>
              <p className="text-sm text-muted-foreground">
                Bank-level security with advanced threat detection
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Premium Experience</h3>
              <p className="text-sm text-muted-foreground">
                Luxury-focused features for 5-star properties
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication Section */}
      <div className="max-w-md mx-auto px-4 pb-20">
        <Card className="modern-card border-0 shadow-luxury">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="font-medium">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="font-medium">
                    Create Account
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="px-6 pb-6">
                <TabsContent value="login" className="mt-0">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h2 className="text-2xl font-serif font-semibold mb-2">Welcome Back</h2>
                      <p className="text-muted-foreground">
                        Sign in to your account to continue
                      </p>
                    </div>
                    <LoginForm 
                      onSuccess={handleAuthSuccess}
                      showCard={false}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h2 className="text-2xl font-serif font-semibold mb-2">
                        {inviteToken ? 'Complete Your Invitation' : 'Create Your Account'}
                      </h2>
                      <p className="text-muted-foreground">
                        {inviteToken 
                          ? 'Fill in your details to join the platform'
                          : 'Get started with your luxury hotel management platform'
                        }
                      </p>
                    </div>
                    <SignupForm 
                      inviteToken={inviteToken || undefined}
                      onSuccess={handleAuthSuccess}
                      showCard={false}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Additional Links */}
        <div className="text-center mt-8 space-y-4">
          <div className="text-sm text-muted-foreground">
            Need help?{' '}
            <Button variant="link" className="p-0 h-auto text-sm">
              Contact Support
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            © 2024 Luxury Hotel Management Platform. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}