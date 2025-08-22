import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import heroHotelBg from "@/assets/hero-hotel-bg.jpg";

const Index = () => {
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

  const plans = [
    {
      name: "Starter",
      price: "₦35,000",
      description: "Perfect for boutique hotels up to 25 rooms",
      features: [
        "Core bookings & front desk",
        "Local payments (POS/Cash/Transfer)",
        "Basic reports & analytics",
        "Email notifications",
        "Offline front desk (24hrs)"
      ],
      popular: false
    },
    {
      name: "Growth",
      price: "₦65,000", 
      description: "Ideal for mid-size hotels 26-75 rooms",
      features: [
        "Everything in Starter",
        "POS & F&B management",
        "Room Service QR module",
        "Extended reports & charts",
        "Power & fuel tracking",
        "WhatsApp notifications"
      ],
      popular: true
    },
    {
      name: "Pro",
      price: "₦120,000",
      description: "Full-featured for large hotels 75+ rooms",
      features: [
        "Everything in Growth",
        "Kiosk self check-in",
        "Multi-property dashboard",
        "Advanced analytics & AI",
        "Custom integrations",
        "Priority support"
      ],
      popular: false
    }
  ];

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
            <Button variant="outline" size="sm">Sign In</Button>
            <Button className="bg-gradient-primary shadow-luxury hover:shadow-hover">Get Started</Button>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section 
        className="py-20 px-4 relative bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 0, 0, 0.7), rgba(255, 215, 0, 0.3)), url(${heroHotelBg})`
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
              <Badge variant="secondary" className="mb-4 bg-accent/10 text-accent border-accent/20">
                <Globe className="h-3 w-3 mr-1" />
                Built for African Hotels
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold display-heading text-gradient mb-6"
              variants={fadeIn}
            >
              Hotel Operations
              <br />
              <span className="text-gradient-accent">Simplified</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
              variants={fadeIn}
            >
              The first hotel management SaaS designed for African markets. Handle offline operations, 
              local payments, fuel tracking, and QR room service in one beautiful platform.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              variants={fadeIn}
            >
              <Button 
                size="lg" 
                className="bg-gradient-primary shadow-luxury hover:shadow-hover text-lg px-8 py-6"
                asChild
              >
                <Link to="/front-desk">
                  Try Front Desk Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 border-primary/20 hover:bg-primary/10"
                asChild
              >
                <Link to="/qr-menu">
                  View QR Menu Demo
                </Link>
              </Button>
            </motion.div>

            <motion.div 
              className="mt-12 flex flex-wrap justify-center items-center gap-8 text-muted-foreground"
              variants={fadeIn}
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span>No setup fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                <span>30-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
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
              Built for African Hotels
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed with local market realities in mind - from power outages to cash payments.
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading text-gradient mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your hotel. All plans include core features with no hidden fees.
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {plans.map((plan, index) => (
              <motion.div key={index} variants={fadeIn}>
                <Card className={`modern-card relative h-full ${plan.popular ? 'ring-2 ring-accent shadow-accent' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-accent text-accent-foreground">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="display-heading text-2xl">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold text-primary">
                      {plan.price}
                      <span className="text-lg font-normal text-muted-foreground">/month</span>
                    </div>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-accent flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-gradient-primary shadow-luxury hover:shadow-hover' : ''}`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.popular ? 'Start Free Trial' : 'Choose Plan'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
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
              See how African hotels are transforming their operations with LuxuryHotelSaaS.
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
      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto">
          <motion.div 
            className="text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading mb-6">
              Experience the Platform Live
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Try our interactive demos and see how LuxuryHotelSaaS can transform your hotel operations.
            </p>
            
            <motion.div 
              className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div variants={fadeIn}>
                <Link to="/qr-menu">
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer group modern-card">
                    <Smartphone className="h-8 w-8 mb-4 mx-auto text-white" />
                    <h3 className="font-semibold mb-2 text-white">QR Menu Demo</h3>
                    <p className="text-sm opacity-80 text-white">Try our room service ordering system</p>
                  </div>
                </Link>
              </motion.div>
              
              <motion.div variants={fadeIn}>
                <Link to="/front-desk">
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer group modern-card">
                    <Users className="h-8 w-8 mb-4 mx-auto text-white" />
                    <h3 className="font-semibold mb-2 text-white">Front Desk</h3>
                    <p className="text-sm opacity-80 text-white">Experience our PWA interface</p>
                  </div>
                </Link>
              </motion.div>
              
              <motion.div variants={fadeIn}>
                <Link to="/owner-dashboard">
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 hover:bg-white/20 transition-all cursor-pointer group modern-card">
                    <BarChart3 className="h-8 w-8 mb-4 mx-auto text-white" />
                    <h3 className="font-semibold mb-2 text-white">Owner Dashboard</h3>
                    <p className="text-sm opacity-80 text-white">View comprehensive analytics</p>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading text-gradient mb-6">
              Ready to Transform Your Hotel?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join hundreds of African hotels already using LuxuryHotelSaaS to streamline operations and delight guests.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-primary shadow-luxury hover:shadow-hover text-lg px-8 py-6"
                asChild
              >
                <Link to="/owner-dashboard">
                  Try Owner Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6"
                asChild
              >
                <Link to="/reports">
                  View Reports Demo
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-muted">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold display-heading text-gradient">
                  LuxuryHotelSaaS
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The Africa-first hotel management platform that understands your unique challenges.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Training</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>© 2024 LuxuryHotelSaaS. Built for African Hotels.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;