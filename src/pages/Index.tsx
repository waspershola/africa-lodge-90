import { useState, useEffect } from "react";
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
  TrendingUp,
  Play,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

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

  const showcaseFeatures = [
    {
      image: "/api/placeholder/400/300",
      title: "Smart Check-in",
      description: "Streamlined guest arrival experience with digital signature and instant room assignment"
    },
    {
      image: "/api/placeholder/400/300", 
      title: "Room Service QR",
      description: "Guests scan, order, and track delivery in real-time from their mobile device"
    },
    {
      image: "/api/placeholder/400/300",
      title: "POS Integration", 
      description: "Unified payment system connecting restaurant, bar, and room charges seamlessly"
    }
  ];

  const carouselFeatures = [
    {
      icon: Building2,
      title: "Multi-Property Dashboard",
      description: "Control multiple locations from one centralized, role-based platform designed for hotel chains and management companies.",
      color: "text-primary"
    },
    {
      icon: Smartphone,
      title: "Mobile-First QR Ordering",
      description: "Guests scan room QR codes to browse menus, place orders, and track delivery status in real-time.",
      color: "text-accent"
    },
    {
      icon: Wifi,
      title: "Offline-Capable Operations",
      description: "Front desk continues operating during power outages with automatic sync when connection returns.",
      color: "text-primary"
    },
    {
      icon: BarChart3,
      title: "Power & Fuel Analytics",
      description: "Track NEPA vs Generator costs, fuel consumption, and operational efficiency with detailed insights.",
      color: "text-accent"
    },
    {
      icon: Shield,
      title: "Local Payment Methods",
      description: "Accept POS, Cash, Bank Transfer, and Online payments with automatic ledger reconciliation.",
      color: "text-primary"
    },
    {
      icon: CreditCard,
      title: "Revenue Optimization",
      description: "Dynamic pricing, upsell recommendations, and detailed financial reporting to maximize profitability.",
      color: "text-accent"
    }
  ];

  const [currentFeature, setCurrentFeature] = useState(0);

  const testimonials = [
    {
      name: "Adebayo Okafor",
      role: "General Manager",
      hotel: "Lagos Grand Hotel", 
      content: "LuxuryHotelSaaS transformed our operations. The offline front desk saved us during power outages, and QR room service increased our F&B revenue by 40%.",
      rating: 5,
      image: "/api/placeholder/80/80"
    },
    {
      name: "Fatima Al-Hassan", 
      role: "Hotel Owner",
      hotel: "Abuja Executive Suites",
      content: "Finally, a hotel system that understands Africa! The fuel tracking alone saves us ₦200,000 monthly, and guests love the seamless QR ordering.",
      rating: 5,
      image: "/api/placeholder/80/80"
    },
    {
      name: "Chidi Nwosu",
      role: "Operations Director", 
      hotel: "Victoria Island Resort",
      content: "Best investment we've made. Staff adoption was instant, and the local payment integration works perfectly with our existing POS systems.",
      rating: 5,
      image: "/api/placeholder/80/80"
    }
  ];

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % carouselFeatures.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextFeature = () => {
    setCurrentFeature((prev) => (prev + 1) % carouselFeatures.length);
  };

  const prevFeature = () => {
    setCurrentFeature((prev) => (prev - 1 + carouselFeatures.length) % carouselFeatures.length);
  };

  const currentCarouselFeature = carouselFeatures[currentFeature];
  const CurrentIcon = currentCarouselFeature.icon;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header 
        className="absolute top-0 left-0 right-0 z-50 bg-transparent"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Hotel className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-playfair text-white">LuxuryHotelSaaS</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-white/90 hover:text-white font-medium transition-colors">Features</a>
            <a href="#showcase" className="text-white/90 hover:text-white font-medium transition-colors">Showcase</a>
            <a href="#testimonials" className="text-white/90 hover:text-white font-medium transition-colors">Reviews</a>
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white hover:text-primary">
              Sign In
            </Button>
            <Button className="bg-gradient-accent text-accent-foreground shadow-luxury hover:shadow-hover">
              Get Started Free
            </Button>
          </nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/api/placeholder/1920/1080')`
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(139, 0, 0, 0.8) 0%, rgba(255, 215, 0, 0.6) 100%)`
            }}
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <motion.div
            className="max-w-5xl mx-auto"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeIn}>
              <Badge className="mb-6 bg-white/20 border-white/30 text-white backdrop-blur-sm">
                <Globe className="h-4 w-4 mr-2" />
                Built for African Hotels
              </Badge>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl lg:text-8xl font-bold font-playfair mb-8 leading-tight"
              variants={fadeIn}
            >
              Redefining Hotel
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-white">
                Management in Africa
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed text-white/90"
              variants={fadeIn}
            >
              The first comprehensive hotel management platform designed specifically for African markets. 
              Seamlessly handle offline operations, local payments, and guest experiences.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
              variants={fadeIn}
            >
              <Button 
                size="lg" 
                className="bg-gradient-accent text-accent-foreground shadow-luxury hover:shadow-hover text-xl px-12 py-8 rounded-full font-semibold transform hover:scale-105 transition-all duration-300"
              >
                Get Started Free
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-xl px-12 py-8 rounded-full border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-sm"
              >
                <Play className="mr-3 h-6 w-6" />
                Book a Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm">Scroll to explore</span>
            <ArrowRight className="h-4 w-4 rotate-90" />
          </div>
        </motion.div>
      </section>

      {/* Showcase Section */}
      <section id="showcase" className="py-24 px-6 bg-background">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold font-playfair text-primary mb-6">
              Experience Excellence in Every Detail
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              See how our platform transforms hotel operations with intelligent automation, 
              seamless guest experiences, and powerful insights.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-12"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {showcaseFeatures.map((feature, index) => (
              <motion.div key={index} variants={fadeIn} className="group">
                <Card className="luxury-card overflow-hidden border-0 shadow-luxury hover:shadow-hover transition-all duration-300 transform group-hover:-translate-y-2">
                  <div className="relative overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold font-playfair text-primary mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Luxury Image Banner */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/api/placeholder/1920/600')`
            }}
          />
          <div className="absolute inset-0 bg-accent/80" />
        </div>
        
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold font-playfair text-accent-foreground mb-6">
              Seamless Experience
            </h2>
            <h3 className="text-3xl md:text-4xl font-playfair text-accent-foreground/90">
              for Guests & Staff
            </h3>
          </motion.div>
        </div>
      </section>

      {/* Features Carousel */}
      <section id="features" className="py-24 px-6 bg-card">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold font-playfair text-primary mb-6">
              Powerful Features Built for Africa
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Every feature designed with local market realities in mind - from power outages to cash payments.
            </p>
          </motion.div>
          
          <div className="relative max-w-6xl mx-auto">
            <div className="overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature}
                  initial={{ opacity: 0, x: 300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.5 }}
                  className="grid lg:grid-cols-2 gap-12 items-center p-12 bg-gradient-subtle rounded-2xl"
                >
                  <div className="space-y-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
                      <CurrentIcon className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold font-playfair text-primary mb-4">
                        {currentCarouselFeature.title}
                      </h3>
                      <p className="text-lg text-muted-foreground leading-relaxed">
                        {currentCarouselFeature.description}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Button className="bg-gradient-accent text-accent-foreground">
                        Learn More
                      </Button>
                      <Button variant="outline">
                        View Demo
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="aspect-video bg-gradient-primary/10 rounded-xl flex items-center justify-center">
                      <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center">
                        <CurrentIcon className="h-12 w-12 text-white" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Carousel Controls */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={prevFeature}
                className="rounded-full w-14 h-14 p-0"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              
              <div className="flex gap-3">
                {carouselFeatures.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentFeature(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentFeature 
                        ? 'bg-primary scale-125' 
                        : 'bg-muted hover:bg-primary/50'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                variant="outline"
                size="lg"
                onClick={nextFeature}
                className="rounded-full w-14 h-14 p-0"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 overflow-hidden">
        {/* Background Image with Golden Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/api/placeholder/1920/800')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-accent/90 to-accent/70" />
        </div>

        <div className="relative z-10 container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold font-playfair text-accent-foreground mb-6">
              Loved by Hotel Operators Across Africa
            </h2>
            <p className="text-xl text-accent-foreground/90 max-w-3xl mx-auto leading-relaxed">
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
                <Card className="luxury-card h-full bg-white/95 backdrop-blur-sm border-0 shadow-luxury">
                  <CardContent className="p-8">
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                      ))}
                    </div>
                    <blockquote className="text-lg italic leading-relaxed text-foreground mb-8">
                      "{testimonial.content}"
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={testimonial.image} 
                          alt={testimonial.name}
                          className="h-16 w-16 rounded-full object-cover border-4 border-accent/20"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-primary text-lg">{testimonial.name}</div>
                        <div className="text-muted-foreground">{testimonial.role}</div>
                        <div className="text-accent font-medium">{testimonial.hotel}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final Call-to-Action */}
      <section className="relative py-32 overflow-hidden">
        {/* Background Image with Sunset Overlay */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('/api/placeholder/1920/800')`
            }}
          />
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, rgba(139, 0, 0, 0.7) 0%, rgba(255, 215, 0, 0.5) 100%)`
            }}
          />
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div 
            className="text-center text-white max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold font-playfair mb-8">
              Ready to Transform Your Hotel?
            </h2>
            <p className="text-xl md:text-2xl mb-12 opacity-90 leading-relaxed">
              Join hundreds of African hotels already revolutionizing their operations with our platform.
            </p>
            
            <Button 
              size="lg"
              className="bg-gradient-accent text-accent-foreground shadow-luxury hover:shadow-hover text-2xl px-16 py-10 rounded-full font-bold transform hover:scale-105 transition-all duration-300"
            >
              Start Managing Smarter
              <ArrowRight className="ml-4 h-8 w-8" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary py-16 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-gradient-accent flex items-center justify-center">
                  <Hotel className="h-7 w-7 text-accent-foreground" />
                </div>
                <span className="text-2xl font-bold font-playfair text-white">LuxuryHotelSaaS</span>
              </div>
              <p className="text-white/80 text-lg leading-relaxed mb-8">
                The first comprehensive hotel management platform designed specifically for African markets. 
                Transform your operations with offline capabilities, local payments, and seamless guest experiences.
              </p>
              <div className="flex space-x-6">
                <a href="#" className="text-accent hover:text-white transition-colors">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-accent hover:text-white transition-colors">
                  <Twitter className="h-6 w-6" />
                </a>
                <a href="#" className="text-accent hover:text-white transition-colors">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-accent hover:text-white transition-colors">
                  <Linkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-accent text-lg mb-6">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-white/80 hover:text-accent transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-white/80 hover:text-accent transition-colors">Pricing</a></li>
                <li><a href="#showcase" className="text-white/80 hover:text-accent transition-colors">Showcase</a></li>
                <li><a href="#" className="text-white/80 hover:text-accent transition-colors">API Docs</a></li>
                <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-accent text-lg mb-6">Company</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-white/80 hover:text-accent transition-colors">About</a></li>
                <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Contact</a></li>
                <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Privacy</a></li>
                <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Terms</a></li>
                <li><a href="#" className="text-white/80 hover:text-accent transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-lg">
              © 2024 LuxuryHotelSaaS. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-6 md:mt-0">
              <div className="flex items-center gap-2 text-accent">
                <MapPin className="h-5 w-5" />
                <span className="font-medium">Made in Nigeria 🇳🇬</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;