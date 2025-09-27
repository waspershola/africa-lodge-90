import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Loader2, Video } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDemoConfig } from '@/hooks/useDemoConfig';

export function DemoVideoSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const { config, loading } = useDemoConfig();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  if (loading || !config || !config.enabled) {
    return null;
  }

  const openVideo = () => {
    setIsVideoOpen(true);
  };

  const closeVideo = () => {
    setIsVideoOpen(false);
  };

  // Extract video ID from YouTube URL for thumbnail
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Convert any YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const videoId = getYouTubeVideoId(config.video_url);
  const thumbnailUrl = config.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '');
  const embedUrl = getYouTubeEmbedUrl(config.video_url);

  return (
    <>
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold display-heading text-gradient mb-4">
              {config.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {config.description}
            </p>
          </motion.div>
          
          <motion.div 
            className="max-w-4xl mx-auto"
            variants={fadeIn}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            <Card className="modern-card overflow-hidden group cursor-pointer" onClick={openVideo}>
              <CardContent className="p-0 relative">
                <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-accent/10">
                  {thumbnailUrl && (
                    <img 
                      src={thumbnailUrl}
                      alt="Demo video thumbnail"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 group-hover:scale-110 transition-transform shadow-2xl">
                      <Play className="h-12 w-12 text-primary ml-1" fill="currentColor" />
                    </div>
                  </div>
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-4 right-4 bg-black/80 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                    <Video className="h-4 w-4 inline mr-1" />
                    Demo
                  </div>
                </div>
                
                {/* CTA Section */}
                <div className="p-8 text-center bg-card">
                  <Button 
                    size="lg" 
                    className="bg-gradient-primary shadow-luxury hover:shadow-hover"
                    onClick={(e) => {
                      e.stopPropagation();
                      openVideo();
                    }}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {config.cta_text}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    No signup required • 5 minute overview
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Video Modal */}
      <Dialog open={isVideoOpen} onOpenChange={closeVideo}>
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video">
            {isVideoOpen && (
              <iframe
                src={`${embedUrl}?autoplay=1&rel=0`}
                title="Demo Video"
                className="w-full h-full rounded-lg"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}