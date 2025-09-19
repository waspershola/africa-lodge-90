import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Video, 
  Save, 
  RefreshCw,
  Eye,
  EyeOff,
  Play,
  ExternalLink
} from 'lucide-react';
import { useDemoConfig } from '@/hooks/useDemoConfig';

export function DemoConfigManager() {
  const { config, loading, updateConfig, refreshConfig } = useDemoConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [editedConfig, setEditedConfig] = useState(config);
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading demo configuration...
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No demo configuration found</p>
        </CardContent>
      </Card>
    );
  }

  const startEditing = () => {
    setEditedConfig({ ...config });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedConfig(config);
    setIsEditing(false);
  };

  const saveChanges = async () => {
    if (!editedConfig) return;
    
    setSaving(true);
    try {
      await updateConfig(editedConfig);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save demo config:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof typeof config, value: any) => {
    if (editedConfig) {
      setEditedConfig({ ...editedConfig, [field]: value });
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const previewUrl = isEditing ? editedConfig?.video_url : config.video_url;
  const videoId = previewUrl ? getYouTubeVideoId(previewUrl) : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Demo Video Configuration</h2>
          <p className="text-muted-foreground">Manage the demo video section on the homepage</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={refreshConfig}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={startEditing}>
                <Video className="mr-2 h-4 w-4" />
                Edit Demo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
              <Button 
                onClick={saveChanges}
                disabled={saving}
                className="bg-gradient-primary"
              >
                {saving ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Demo Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Enable Demo Section</Label>
                <div className="text-sm text-muted-foreground">
                  Show/hide the demo video section on homepage
                </div>
              </div>
              <Switch
                checked={isEditing ? editedConfig?.enabled : config.enabled}
                onCheckedChange={(checked) => updateField('enabled', checked)}
                disabled={!isEditing}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                value={isEditing ? editedConfig?.title || '' : config.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="See LuxuryHotelSaaS in Action"
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={isEditing ? editedConfig?.description || '' : config.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Watch how hotels worldwide are transforming..."
                disabled={!isEditing}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video-url">YouTube Video URL</Label>
              <Input
                id="video-url"
                value={isEditing ? editedConfig?.video_url || '' : config.video_url}
                onChange={(e) => updateField('video_url', e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={!isEditing}
              />
              <p className="text-xs text-muted-foreground">
                Supports YouTube watch or embed URLs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta-text">Call-to-Action Text</Label>
              <Input
                id="cta-text"
                value={isEditing ? editedConfig?.cta_text || '' : config.cta_text}
                onChange={(e) => updateField('cta_text', e.target.value)}
                placeholder="Watch Full Demo"
                disabled={!isEditing}
              />
            </div>

            {videoId && (
              <Alert>
                <Play className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Valid YouTube video detected</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://youtube.com/watch?v=${videoId}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {config.enabled ? (
                <Eye className="h-5 w-5" />
              ) : (
                <EyeOff className="h-5 w-5" />
              )}
              Live Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(isEditing ? editedConfig?.enabled : config.enabled) ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-bold">
                    {isEditing ? editedConfig?.title : config.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isEditing ? editedConfig?.description : config.description}
                  </p>
                </div>
                
                {thumbnailUrl && (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden group cursor-pointer">
                    <img 
                      src={thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="bg-white/90 rounded-full p-3">
                        <Play className="h-6 w-6 text-primary ml-0.5" fill="currentColor" />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <Button size="sm" className="bg-gradient-primary">
                    <Play className="mr-2 h-4 w-4" />
                    {isEditing ? editedConfig?.cta_text : config.cta_text}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Demo section is currently disabled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}