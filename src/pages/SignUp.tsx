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
    
    if (!formData.hotelName || !formData.ownerName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // Create trial account using the trial-signup edge function
      const { data, error } = await supabase.functions.invoke('trial-signup', {
        body: {
          hotel_name: formData.hotelName,
          owner_name: formData.ownerName,
          owner_email: formData.email,
          phone: formData.phone,
          city: formData.city,
          country: 'Nigeria' // Default country
        }
      });

      if (error) {
        console.error('Trial signup error:', error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to create trial account');
      }

      if (data.email_sent) {
        toast.success('Trial account created successfully! Please check your email for login instructions.');
      } else {
        toast.success(`Trial account created! Your temporary password: ${data.temp_password}`);
      }
      
      // Redirect to login page
      navigate('/', { 
        state: { 
          message: 'Your 14-day free trial is ready! Please sign in to continue.',
          email: formData.email 
        }
      });

    } catch (error: any) {
      console.error('Trial signup failed:', error);
      toast.error(error.message || 'Failed to create trial account. Please try again.');
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
            <span className="text-xl font-bold text-white">LuxuryHotelSaaS</span>
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
              Join thousands of hotels worldwide using LuxuryHotelSaaS
            </CardDescription>
            <div className="flex justify-center mt-4">
              <Badge className="bg-success/10 text-success border-success/20">
                30-day free trial • No credit card required
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
                  Trial Information
                </h3>
                <div className="bg-gradient-subtle p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-success/20 text-success border-success/30">
                      14-Day Free Trial
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your trial includes full access to all features. We'll send you a temporary password to get started.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-primary shadow-luxury hover:shadow-hover text-lg py-6"
                disabled={isLoading}
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