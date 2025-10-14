import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Lock, User, Phone, MapPin, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import heroHotelBg from '@/assets/hero-hotel-bg.jpg';
import { PasswordStrength } from '@/components/ui/password-strength';

const SignUp = () => {
  const [formData, setFormData] = useState({
    hotelName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const operationId = crypto.randomUUID();
    console.log(`[SignUp][${operationId}] Starting signup process:`, {
      email: formData.email,
      hotelName: formData.hotelName
    });
    
    if (!formData.hotelName || !formData.ownerName || !formData.email || !formData.password) {
      console.warn(`[SignUp][${operationId}] Required fields validation failed`);
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      console.warn(`[SignUp][${operationId}] Password mismatch validation failed`);
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      console.warn(`[SignUp][${operationId}] Password length validation failed`);
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      console.log(`[SignUp][${operationId}] Invoking trial-signup function...`);
      
      // Create trial account using the trial-signup edge function
      const { data, error } = await supabase.functions.invoke('trial-signup', {
        body: {
          hotel_name: formData.hotelName,
          owner_name: formData.ownerName,
          owner_email: formData.email,
          phone: formData.phone,
          city: formData.city,
          country: 'Nigeria', // Default country
          password: formData.password
        }
      });

      console.log(`[SignUp][${operationId}] Function response:`, {
        success: data?.success,
        error_code: data?.error_code,
        has_error: !!error
      });

      if (error) {
        console.error(`[SignUp][${operationId}] Edge function error:`, error);
        throw error;
      }

      if (!data?.success) {
        console.error(`[SignUp][${operationId}] Signup failed:`, data);
        
        // Use error_code for more specific handling
        let errorMessage = data?.error || 'Failed to create trial account';
        if (data?.error_code === 'USER_EXISTS') {
          errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
        } else if (data?.error_code === 'PLAN_NOT_FOUND') {
          errorMessage = 'Unable to activate trial plan. Please contact support.';
        }
        
        throw new Error(errorMessage);
      }

      console.log(`[SignUp][${operationId}] Signup successful, redirecting...`);
      toast.success(data.email_sent 
        ? 'Trial account created! Check your email for login instructions.'
        : 'Trial account created successfully! You can now sign in with your credentials.');
      
      // Redirect to login page
      navigate('/', { 
        state: { 
          message: 'Your 14-day free trial is ready! Please sign in to continue.',
          email: formData.email 
        }
      });

    } catch (error: any) {
      console.error(`[SignUp][${operationId}] Signup failed:`, {
        error: error.message,
        stack: error.stack
      });
      
      // Handle specific error cases
      if (error.message?.includes('already exists')) {
        toast.error('An account with this email already exists. Please use a different email or try signing in.');
      } else if (error.message?.includes('permissions')) {
        toast.error('There was a permissions issue. Please try again or contact support.');
      } else if (error.message?.includes('not found')) {
        toast.error('Service not available. Please contact support.');
      } else {
        toast.error(error.message || 'Failed to create trial account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4"
      style={{
        backgroundImage: `linear-gradient(rgba(139, 0, 0, 0.8), rgba(255, 215, 0, 0.4)), url(${heroHotelBg})`
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">LUXURYHOTELPRO</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-white/90">Already have an account?</span>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link to="/">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl mt-16"
      >
        <Card className="modern-card bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold display-heading text-gradient">
              Start Your Free Trial
            </CardTitle>
            <CardDescription className="text-lg">
              Join thousands of hotels worldwide using LUXURYHOTELPRO
            </CardDescription>
            <div className="flex justify-center mt-4">
              <Badge className="bg-success/10 text-success border-success/20">
                14-Day Free Trial
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-6">
              {/* Hotel Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Hotel Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="hotelName"
                      placeholder="Hotel Name"
                      value={formData.hotelName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="ownerName"
                      placeholder="Your Full Name"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="email"
                      type="email"
                      placeholder="Your Email Address"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Security */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Create Password
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="password"
                      type="password"
                      placeholder="Create Password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-10"
                      minLength={8}
                      required
                    />
                  </div>
                  {formData.password && (
                    <PasswordStrength password={formData.password} className="mt-2" />
                  )}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="pl-10"
                      minLength={8}
                      required
                    />
                  </div>
                </div>
                <div className="bg-gradient-subtle p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-success/20 text-success border-success/30">
                      14-Day Free Trial
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your trial includes full access to all features. We'll send you a temporary password to get started only.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary shadow-luxury hover:shadow-hover text-lg py-6"
                disabled={isLoading || !formData.password || formData.password !== formData.confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Your Account...
                  </>
                ) : (
                  <>
                    Start Free Trial
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SignUp;