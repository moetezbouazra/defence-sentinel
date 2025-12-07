import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Camera, Eye, Play } from 'lucide-react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getDashboardStats, getTimeline, getAlerts, triggerCameraCapture, getAvailableCameras } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io, Socket } from 'socket.io-client';
import { DashboardSkeleton } from '@/components/ui/skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import PageTransition from '@/components/PageTransition';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
let socket: Socket | null = null;

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 rounded-xl bg-card border border-border backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-foreground">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs font-medium text-emerald-400">{trend}</span>
        <span className="text-xs text-muted-foreground">{t('vsLast24h')}</span>
      </div>
    )}
  </motion.div>
);

const Dashboard = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [isConnected, setIsConnected] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000,
  });

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline'],
    queryFn: getTimeline,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['recent-alerts'],
    queryFn: () => getAlerts({ limit: 5 }),
    refetchInterval: 10000,
  });

  const isLoading = statsLoading || timelineLoading || alertsLoading;

  const { data: cameras } = useQuery({
    queryKey: ['available-cameras'],
    queryFn: getAvailableCameras,
  });

  const triggerMutation = useMutation({
    mutationFn: triggerCameraCapture,
    onSuccess: (data) => {
      toast.success(t('motionTriggered', { deviceId: data.deviceId }));
      // Invalidate queries to refresh dashboard
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['timeline'] });
      }, 2000);
    },
    onError: (error: any) => {
      toast.error(error.message || t('failedTriggerCamera'));
    },
  });

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      const wsUrl = API_URL.replace('/api', '');
      socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        console.log('Socket.IO connected to Dashboard');
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket.IO disconnected from Dashboard');
        setIsConnected(false);
      });

      // Listen for real-time events
      socket.on('event:new', () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        queryClient.invalidateQueries({ queryKey: ['timeline'] });
      });

      socket.on('alert:new', () => {
        queryClient.invalidateQueries({ queryKey: ['recent-alerts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      });

      socket.on('device:status', () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      });
    }

    return () => {
      if (socket) {
        socket.off('event:new');
        socket.off('alert:new');
        socket.off('device:status');
      }
    };
  }, [queryClient]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <PageTransition>
    <div className="space-y-8">
      {/* Live Indicator */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-medium">Live Updates Active</span>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          title={t('totalEvents24h')} 
          value={stats?.totalEvents24h || 0} 
          icon={Activity} 
          color="bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
        />
        <StatCard 
          title={t('activeThreats')} 
          value={stats?.activeThreats || 0} 
          icon={ShieldAlert} 
          color="bg-gradient-to-br from-red-500/20 to-orange-500/20"
        />
        <StatCard 
          title={t('camerasOnline')} 
          value={`${stats?.onlineDevices || 0}/${stats?.totalDevices || 0}`} 
          icon={Camera} 
          color="bg-gradient-to-br from-cyan-500/20 to-blue-500/20"
        />
        <StatCard 
          title={t('systemStatus')} 
          value={t('operational')} 
          icon={Eye} 
          color="bg-gradient-to-br from-emerald-500/20 to-green-500/20"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Timeline Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{t('eventActivity7Days')}</h3>
          </div>
          <div className="h-[300px] w-full bg-slate-900/50 rounded-xl border border-slate-800 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="space-y-6">
          {/* Manual Camera Trigger */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t('manualCapture')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('triggerMotionDetection')}
              </p>
              {cameras?.cameras?.map((cameraId: string) => (
                <Button
                  key={cameraId}
                  onClick={() => triggerMutation.mutate(cameraId)}
                  disabled={triggerMutation.isPending}
                  variant="outline"
                  className="w-full justify-between"
                  size="sm"
                >
                  <span>{cameraId}</span>
                  <Play className="h-4 w-4" />
                </Button>
              ))}
            </CardContent>
          </Card>

          <h3 className="text-lg font-semibold">{t('recentAlerts')}</h3>
          <div className="space-y-4">
            {alerts?.data?.map((alert: any) => (
              <div key={alert.id} className="p-4 rounded-lg bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                  <div>
                    <h4 className="text-sm font-medium text-slate-200">{alert.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {alert.event?.device?.name} • {new Date(alert.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(!alerts?.data || alerts.data.length === 0) && (
              <div className="text-center text-slate-500 py-8">
                {t('noRecentAlerts')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Dashboard;
