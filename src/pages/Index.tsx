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
  CreditCard
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: <Building2 className="h-8 w-8" />,
      title: "Multi-Property Management",
      description: "Manage multiple hotels from one dashboard with tenant isolation and role-based access."
    },
    {
      icon: <Smartphone className="h-8 w-8" />,
      title: "QR Room Service",
      description: "Guests scan room QR codes to order food, track delivery, and pay seamlessly."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Front Desk PWA",
      description: "Offline-capable check-in/out system that works even when internet is unstable."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Power & Fuel Tracking",
      description: "Monitor NEPA vs Generator costs, diesel consumption, and efficiency analytics."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Local Payments",
      description: "POS, Cash, Transfer, and Online payments with automatic ledger reconciliation."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Africa-First Design",
      description: "Built for African markets with WhatsApp integration and unstable power considerations."
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="font-playfair text-2xl font-bold text-gradient">
              LuxuryHotelSaaS
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
              Reviews
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
            <Button className="bg-gradient-primary" size="sm">
              Start Free Trial
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-24 lg:py-32">
        <div className="absolute inset-0 hotel-pattern opacity-30" />
        <div className="relative container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-accent/20 text-accent-foreground hover:bg-accent/30" variant="secondary">
              🌍 Built for African Hotels
            </Badge>
            
            <h1 className="font-playfair text-5xl font-bold text-white md:text-7xl lg:text-8xl mb-8 animate-fade-in">
              Hotel Operations
              <br />
              <span className="text-accent">Simplified</span>
            </h1>
            
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up">
              The first hotel management SaaS designed for African markets. Handle offline operations, 
              local payments, fuel tracking, and QR room service in one beautiful platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-bounce-in">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-4" asChild>
                <a href="/front-desk">
                  Try Front Desk Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4" asChild>
                <a href="/qr-menu">
                  View QR Menu Demo
                </a>
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/70">
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
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold mb-4 text-gradient">
              Built for African Hotels
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every feature designed with local market realities in mind - from power outages to cash payments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="luxury-card group">
                <CardHeader>
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-playfair text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* African Market Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-accent mb-2">500+</div>
              <div className="text-primary-foreground/80">Hotels Ready</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">95%</div>
              <div className="text-primary-foreground/80">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">24/7</div>
              <div className="text-primary-foreground/80">Local Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-accent mb-2">₦200k+</div>
              <div className="text-primary-foreground/80">Avg Monthly Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold mb-4 text-gradient">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your hotel. All plans include core features with no hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={index} className={`luxury-card relative ${plan.popular ? 'ring-2 ring-accent shadow-accent' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground">
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="font-playfair text-2xl">{plan.name}</CardTitle>
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
                        <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-primary' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.popular ? 'Start Free Trial' : 'Choose Plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-playfair text-4xl font-bold mb-4 text-gradient">
              Loved by Hotel Operators
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how African hotels are transforming their operations with LuxuryHotelSaaS.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="luxury-card">
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
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-sm text-accent">{testimonial.hotel}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 hotel-pattern opacity-30" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="font-playfair text-4xl font-bold text-white mb-6">
            Ready to Transform Your Hotel?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join hundreds of African hotels already using LuxuryHotelSaaS to streamline operations and delight guests.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-8 py-4" asChild>
              <a href="/owner-dashboard">
                Try Owner Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4" asChild>
              <a href="/reports">
                View Reports Demo
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-8 w-8 text-accent" />
                <span className="font-playfair text-2xl font-bold">
                  LuxuryHotelSaaS
                </span>
              </div>
              <p className="text-primary-foreground/80 leading-relaxed">
                The Africa-first hotel management platform that understands your unique challenges.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Status</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Training</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">About</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-primary-foreground/60">
            <p>&copy; 2024 LuxuryHotelSaaS. Built with ❤️ for African hotels.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;