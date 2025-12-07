import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDevices, createDevice } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Wifi, WifiOff, Activity, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { Device } from '@/types';
import { toast } from 'react-hot-toast';
import PageTransition from '@/components/PageTransition';
import { EmptyState } from '@/components/ui/empty-state';

export default function Devices() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

  const createMutation = useMutation({
    mutationFn: createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsOpen(false);
      toast.success(t('deviceAdded'));
    },
    onError: () => {
      toast.error(t('failedAddDevice'));
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name'),
      deviceId: formData.get('deviceId'),
      location: formData.get('location'),
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <PageTransition>
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Devices</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Device Name</Label>
                <Input id="name" name="name" placeholder="Front Door Camera" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID (Unique)</Label>
                <Input id="deviceId" name="deviceId" placeholder="CAM_001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Entrance" />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Adding...' : 'Add Device'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {devices && devices.length > 0 ? (
          devices.map((device: Device, index: number) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {device.name}
                  </CardTitle>
                  {device.status === 'ONLINE' ? (
                    <Badge className="bg-emerald-500">
                      <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-300"></span>
                      </span>
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Offline</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{device.deviceId}</div>
                  <p className="text-xs text-muted-foreground">
                    {device.location || 'No location set'}
                  </p>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    {device.status === 'ONLINE' ? (
                      <Wifi className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-rose-500" />
                    )}
                    <span className="text-muted-foreground">
                      {device.status === 'ONLINE' ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Active</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last seen</span>
                    <span>
                      {device.lastSeen 
                        ? format(new Date(device.lastSeen), 'PP p') 
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={Video}
              title="No devices"
              description="Add your first device to start monitoring."
              action={{
                label: 'Add Device',
                onClick: () => setIsOpen(true),
              }}
            />
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
