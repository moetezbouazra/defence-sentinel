import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe, updateProfile } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { User, Bell, Monitor, Cpu, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      toast.success(t('settingsUpdated'));
    },
    onError: () => {
      toast.error(t('failedUpdateSettings'));
    }
  });

  const [displayPrefs, setDisplayPrefs] = useState({
    showConfidenceOnImages: true,
    showCameraName: true,
    confidenceFormat: 'percentage',
    imageQuality: 'original',
    thumbnailSize: 'medium',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailAlerts: true,
    whatsappAlerts: false,
    pushNotifications: true,
    criticalOnly: false,
  });

  const [aiConfig, setAiConfig] = useState({
    personThreshold: 65,
    vehicleThreshold: 70,
    otherThreshold: 75,
  });

  useEffect(() => {
    if (user?.displayPreferences) {
      setDisplayPrefs({ ...displayPrefs, ...user.displayPreferences });
    }
    if (user?.notificationPreferences) {
      setNotificationPrefs({ ...notificationPrefs, ...user.notificationPreferences });
    }
  }, [user]);

  const handleDisplayChange = (key: string, value: any) => {
    const newPrefs = { ...displayPrefs, [key]: value };
    setDisplayPrefs(newPrefs);
    updateMutation.mutate({
      displayPreferences: newPrefs
    });
  };

  const handleNotificationChange = (key: string, value: any) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    updateMutation.mutate({
      notificationPreferences: newPrefs
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

      <Tabs defaultValue="display" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" /> Display
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" /> AI Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>Customize how events and detections are displayed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-confidence" className="flex flex-col space-y-1">
                  <span>Show Confidence Scores</span>
                  <span className="font-normal text-xs text-muted-foreground">Display confidence percentages on bounding boxes</span>
                </Label>
                <Switch 
                  id="show-confidence" 
                  checked={displayPrefs.showConfidenceOnImages}
                  onCheckedChange={(checked) => handleDisplayChange('showConfidenceOnImages', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-camera" className="flex flex-col space-y-1">
                  <span>Show Camera Name</span>
                  <span className="font-normal text-xs text-muted-foreground">Overlay camera name on event images</span>
                </Label>
                <Switch 
                  id="show-camera" 
                  checked={displayPrefs.showCameraName}
                  onCheckedChange={(checked) => handleDisplayChange('showCameraName', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Confidence Format</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={displayPrefs.confidenceFormat === 'percentage' ? 'default' : 'outline'}
                    onClick={() => handleDisplayChange('confidenceFormat', 'percentage')}
                    size="sm"
                  >
                    Percentage (87%)
                  </Button>
                  <Button 
                    variant={displayPrefs.confidenceFormat === 'decimal' ? 'default' : 'outline'}
                    onClick={() => handleDisplayChange('confidenceFormat', 'decimal')}
                    size="sm"
                  >
                    Decimal (0.87)
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thumbnail Size</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={displayPrefs.thumbnailSize === 'small' ? 'default' : 'outline'}
                    onClick={() => handleDisplayChange('thumbnailSize', 'small')}
                    size="sm"
                  >
                    Small
                  </Button>
                  <Button 
                    variant={displayPrefs.thumbnailSize === 'medium' ? 'default' : 'outline'}
                    onClick={() => handleDisplayChange('thumbnailSize', 'medium')}
                    size="sm"
                  >
                    Medium
                  </Button>
                  <Button 
                    variant={displayPrefs.thumbnailSize === 'large' ? 'default' : 'outline'}
                    onClick={() => handleDisplayChange('thumbnailSize', 'large')}
                    size="sm"
                  >
                    Large
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Configure how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email-alerts" className="flex flex-col space-y-1">
                  <span>Email Alerts</span>
                  <span className="font-normal text-xs text-muted-foreground">Receive alerts via email</span>
                </Label>
                <Switch 
                  id="email-alerts" 
                  checked={notificationPrefs.emailAlerts}
                  onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="whatsapp-alerts" className="flex flex-col space-y-1">
                  <span>WhatsApp Alerts (Future)</span>
                  <span className="font-normal text-xs text-muted-foreground">Receive alerts via WhatsApp</span>
                </Label>
                <Switch 
                  id="whatsapp-alerts" 
                  checked={notificationPrefs.whatsappAlerts}
                  onCheckedChange={(checked) => handleNotificationChange('whatsappAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                  <span>Push Notifications</span>
                  <span className="font-normal text-xs text-muted-foreground">Browser push notifications</span>
                </Label>
                <Switch 
                  id="push-notifications" 
                  checked={notificationPrefs.pushNotifications}
                  onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="critical-only" className="flex flex-col space-y-1">
                  <span>Critical Alerts Only</span>
                  <span className="font-normal text-xs text-muted-foreground">Only notify for critical threats</span>
                </Label>
                <Switch 
                  id="critical-only" 
                  checked={notificationPrefs.criticalOnly}
                  onCheckedChange={(checked) => handleNotificationChange('criticalOnly', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input defaultValue={user?.name} disabled />
              </div>
              <p className="text-sm text-muted-foreground">Profile editing coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>Adjust detection thresholds and sensitivity (Demo - not saved)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Person Detection Threshold</Label>
                  <span className="text-sm text-muted-foreground">{aiConfig.personThreshold}%</span>
                </div>
                <Slider 
                  value={[aiConfig.personThreshold]} 
                  max={100} 
                  step={1}
                  onValueChange={([value]) => setAiConfig({ ...aiConfig, personThreshold: value })}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Vehicle Detection Threshold</Label>
                  <span className="text-sm text-muted-foreground">{aiConfig.vehicleThreshold}%</span>
                </div>
                <Slider 
                  value={[aiConfig.vehicleThreshold]} 
                  max={100} 
                  step={1}
                  onValueChange={([value]) => setAiConfig({ ...aiConfig, vehicleThreshold: value })}
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Label>Other Objects Threshold</Label>
                  <span className="text-sm text-muted-foreground">{aiConfig.otherThreshold}%</span>
                </div>
                <Slider 
                  value={[aiConfig.otherThreshold]} 
                  max={100} 
                  step={1}
                  onValueChange={([value]) => setAiConfig({ ...aiConfig, otherThreshold: value })}
                />
              </div>
              <p className="text-sm text-muted-foreground">Note: AI threshold configuration will be saved to backend in future update</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
