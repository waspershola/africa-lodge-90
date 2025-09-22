import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Smartphone, 
  Users, 
  BarChart3, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  Wifi,
  CreditCard,
  Hotel,
  Clock,
  TrendingUp,
  Activity,
  Settings,
  UtensilsCrossed,
  Mail,
  Lock,
  LogIn,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/components/auth/MultiTenantAuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { TrialSignupFlow } from "@/components/auth/TrialSignupFlow";
import { PricingSection } from "@/components/pricing/PricingSection";
import { DemoVideoSection } from "@/components/demo/DemoVideoSection";
import heroHotelBg from "@/assets/hero-hotel-bg.jpg";
import sunsetHotelBg from "@/assets/sunset-hotel-bg.jpg";
import diningHotelBg from "@/assets/dining-hotel-bg.jpg";

const Index = () => {
  const [trialSignupOpen, setTrialSignupOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const getUserDashboardPath = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return '/sa/dashboard';
      case 'OWNER': return '/owner-dashboard'; 
      case 'MANAGER': return '/manager-dashboard';
      case 'FRONT_DESK': return '/front-desk';
      case 'HOUSEKEEPING': return '/housekeeping-dashboard';
      case 'MAINTENANCE': return '/maintenance-dashboard';
      case 'POS': return '/pos';
      default: return '/owner-dashboard';
    }
  };

  const handleTrialSignupSuccess = () => {
    setTrialSignupOpen(false);
    // User will be redirected to onboarding by the auth system
  };

  // Redirect authenticated users to appropriate dashboard
  useEffect(() => {
    if (user) {
      console.log('User authenticated, redirecting to:', getUserDashboardPath(user.role));
      navigate(getUserDashboardPath(user.role), { replace: true });
    }
  }, [user, navigate]);

  // Don't render the page content if user is authenticated (will redirect)
  if (user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p>Redirecting to your dashboard...</p>
      </div>
    </div>;
  }
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: Building2,
      title: "Multi-Property Management",
      description: "Manage multiple hotels from one dashboard with tenant isolation and role-based access.",
      color: "text-primary"
    },
    {
      icon: Smartphone,
      title: "QR Room Service",
      description: "Guests scan room QR codes to order food, track delivery, and pay seamlessly.",
      color: "text-accent"
    },
    {
      icon: Users,
      title: "Front Desk PWA",
      description: "Offline-capable check-in/out system that works even when internet is unstable.",
      color: "text-primary"
    },
    {
      icon: BarChart3,
      title: "Power & Fuel Tracking",
      description: "Monitor NEPA vs Generator costs, diesel consumption, and efficiency analytics.",
      color: "text-accent"
    },
    {
      icon: Shield,
      title: "Local Payments",
      description: "POS, Cash, Transfer, and Online payments with automatic ledger reconciliation.",
      color: "text-primary"
    },
    {
      icon: Zap,
      title: "Africa-First Design",
      description: "Built for African markets with WhatsApp integration and unstable power considerations.",
      color: "text-accent"
    }
  ];


  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoginLoading(true);
    try {
      console.log('Quick login attempt for:', email);
      await login(email, password);
      console.log('Quick login successful');
      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error('Quick login failed:', error);
      // The error is already handled by the login function
    } finally {
      setLoginLoading(false);
    }
  };

  const testimonials = [
    {
      name: "Adebayo Okafor",
      role: "General Manager",
      hotel: "Lagos Grand Hotel",
      content: "LuxuryHotelSaaS transformed our operations. The offline front desk saved us during power outages, and QR room service increased our F&B revenue by 40%.",
      rating: 5
    },
    {
      name: "Fatima Al-Hassan",
      role: "Owner",
      hotel: "Abuja Executive Suites",
      content: "Finally, a hotel system that understands Africa! The fuel tracking alone saves us ₦200,000 monthly, and guests love the seamless QR ordering.",
      rating: 5
    },
    {
      name: "Chidi Nwosu",
      role: "Operations Director",
      hotel: "Victoria Island Resort",
      content: "Best investment we've made. Staff adoption was instant, and the local payment integration works perfectly with our existing POS systems.",
      rating: 5
    }
  ];

  const stats = [
    { number: "500+", label: "Hotels Onboarded", icon: Hotel },
    { number: "95%", label: "Uptime Guarantee", icon: Clock },
    { number: "40%", label: "Faster Check-ins", icon: TrendingUp },
    { number: "₦200k+", label: "Avg Monthly Savings", icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold display-heading text-gradient">LuxuryHotelSaaS</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Reviews</a>
            <Button variant="outline" size="sm">About</Button>
            <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover" size="sm">
              Request Demo
            </Button>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section 
        className="py-20 px-4 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 0, 0, 0.8), rgba(255, 215, 0, 0.4)), url(${heroHotelBg})`
        }}
      >
        <div className="container mx-auto text-center">
          <motion.div
            className="max-w-4xl mx-auto"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeIn}>
              <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Globe className="h-3 w-3 mr-1" />
                Modern Hotel Management
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold display-heading text-white mb-6 drop-shadow-lg"
              variants={fadeIn}
            >
              Redefining Hotel Management
              <br />
              <span className="text-yellow-300">Worldwide</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md"
              variants={fadeIn}
            >
              Complete hotel management platform designed for modern hospitality. Handle operations, 
              payments, room service, and analytics in one unified system.
            </motion.p>
            
            {/* Hero Login Form */}
            <motion.div 
              className="mb-8 max-w-md mx-auto"
              variants={fadeIn}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-semibold text-white text-center mb-4">
                  Sign In to Your Dashboard
                </h3>
                <form onSubmit={handleQuickLogin} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                      disabled={loginLoading}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/60" />
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                      disabled={loginLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3"
                    disabled={loginLoading || !email || !password}
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Sign In to Dashboard
                      </>
                    )}
                  </Button>
                </form>
                <p className="text-xs text-white/70 text-center mt-3">
                  New hotel? <Button variant="link" className="text-yellow-300 p-0 h-auto text-xs">Request a demo</Button>
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={fadeIn}
            >
              <Button 
                size="lg" 
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 text-lg px-8 py-6 font-semibold backdrop-blur-sm"
                asChild
              >
                <Link to="/front-desk">
                  Try Demo Mode
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent hover:bg-white/10 text-white border-white/30 text-lg px-8 py-6 font-semibold"
                asChild
              >
                <Link to="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div 
              className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/80"
              variants={fadeIn}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>14-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-300" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="text-center"
                variants={fadeIn}
              >
                <div className="flex justify-center mb-3">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl font-bold text-primary mb-1">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading text-gradient mb-4">
              Built for Modern Hotels
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed with real-world challenges in mind - from offline operations to diverse payment methods.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className="modern-card h-full group cursor-pointer">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl display-heading">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Video Section */}
      <DemoVideoSection />

      {/* Dynamic Pricing Section */}
      <PricingSection />

      {/* Testimonials */}
      <section 
        id="testimonials" 
        className="py-20 px-4 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 215, 0, 0.9), rgba(255, 215, 0, 0.7)), url(${diningHotelBg})`
        }}
      >
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading text-gradient mb-4">
              Loved by Hotel Operators
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how hotels worldwide are transforming their operations with LuxuryHotelSaaS.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {testimonials.map((testimonial, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className="modern-card h-full">
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                      ))}
                    </div>
                    <CardDescription className="text-base italic leading-relaxed">
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        <div className="text-sm text-accent font-medium">{testimonial.hotel}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section 
        className="py-20 px-4 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 0, 0, 0.9), rgba(0, 0, 0, 0.7)), url(${heroHotelBg})`
        }}
      >
        <div className="container mx-auto">
          <motion.div 
            className="text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading mb-6 text-white drop-shadow-lg">
              Experience the Platform Live
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90 drop-shadow-md">
              Try our interactive demos and see how LuxuryHotelSaaS can transform your hotel operations.
            </p>
            
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 max-w-6xl mx-auto"
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeIn}>
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 w-full h-auto flex flex-col gap-3"
                  asChild
                >
                  <Link to="/qr-portal">
                    <Smartphone className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">QR Portal Demo</div>
                      <div className="text-sm opacity-80">Try our unified guest services system</div>
                    </div>
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div variants={fadeIn}>
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 w-full h-auto flex flex-col gap-3"
                  asChild
                >
                  <Link to="/front-desk">
                    <Users className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">Front Desk</div>
                      <div className="text-sm opacity-80">Experience our PWA interface</div>
                    </div>
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div variants={fadeIn}>
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 w-full h-auto flex flex-col gap-3"
                  asChild
                >
                  <Link to="/owner-dashboard">
                    <BarChart3 className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">Owner Dashboard</div>
                      <div className="text-sm opacity-80">View comprehensive analytics</div>
                    </div>
                  </Link>
                </Button>
              </motion.div>
              
              <motion.div variants={fadeIn}>
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 w-full h-auto flex flex-col gap-3"
                  asChild
                >
                  <Link to="/manager-dashboard">
                    <Activity className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">Manager Dashboard</div>
                      <div className="text-sm opacity-80">Operations control center</div>
                    </div>
                  </Link>
                </Button>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 w-full h-auto flex flex-col gap-3"
                  asChild
                >
                  <Link to="/housekeeping-dashboard">
                    <CheckCircle className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">Housekeeping</div>
                      <div className="text-sm opacity-80">Manage cleaning & supplies</div>
                    </div>
                  </Link>
                </Button>
              </motion.div>

              <motion.div variants={fadeIn}>
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 w-full h-auto flex flex-col gap-3"
                  asChild
                >
                  <Link to="/maintenance-dashboard">
                    <Settings className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">Maintenance</div>
                      <div className="text-sm opacity-80">Work orders & facility management</div>
                    </div>
                  </Link>
                </Button>
              </motion.div>
              <motion.div variants={fadeIn}>
                <Button 
                  size="lg" 
                  className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 w-full h-auto flex flex-col gap-3"
                  asChild
                >
                  <Link to="/pos/dashboard">
                    <UtensilsCrossed className="h-8 w-8" />
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">Restaurant POS</div>
                      <div className="text-sm opacity-80">Food & beverage operations</div>
                    </div>
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 px-4 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 0, 0, 0.8), rgba(255, 215, 0, 0.3)), url(${sunsetHotelBg})`
        }}
      >
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading text-white mb-6 drop-shadow-lg">
              Start Managing Smarter
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
              Join hundreds of hotels worldwide already using LuxuryHotelSaaS to streamline operations and delight guests.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300"
                onClick={() => setTrialSignupOpen(true)}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-yellow-500 hover:bg-red-700 text-black hover:text-white text-lg px-8 py-6 font-semibold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 border-0"
                asChild
              >
                <Link to="/reports">
                  Book a Demo
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4" style={{ backgroundColor: '#8B0000' }}>
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-yellow-400" />
                <span className="text-2xl font-bold display-heading text-white">
                  LuxuryHotelSaaS
                </span>
              </div>
              <p className="text-white/80 leading-relaxed">
                The modern hotel management platform that understands your unique challenges.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#features" className="hover:text-yellow-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-yellow-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Training</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/70">
            <p>© 2024 LuxuryHotelSaaS. Built for Modern Hotels.</p>
          </div>
        </div>
      </footer>
      {/* Trial Signup Dialog */}
      <TrialSignupFlow 
        open={trialSignupOpen}
        onOpenChange={setTrialSignupOpen}
        onSuccess={handleTrialSignupSuccess}
      />
    </div>
  );
};

export default Index;