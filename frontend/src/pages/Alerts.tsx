import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, acknowledgeAlert } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertOctagon, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import type { PaginatedResponse } from '@/types';
import { AlertItemSkeleton } from '@/components/ui/skeletons';
import PageTransition from '@/components/PageTransition';
import { EmptyState } from '@/components/ui/empty-state';

interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
  event: {
    id: string;
    device: {
      name: string;
    };
  };
}

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('all');
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Alert>>({
    queryKey: ['alerts', page, activeTab],
    queryFn: () => getAlerts({ 
      page, 
      limit: 10,
      acknowledged: activeTab === 'unread' ? false : activeTab === 'acknowledged' ? true : undefined,
      severity: activeTab === 'critical' ? 'CRITICAL' : undefined
    }),
  });

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success(t('alertAcknowledged'));
    },
    onError: () => {
      toast.error(t('failedAcknowledgeAlert'));
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
        </div>
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <AlertItemSkeleton key={i} />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="acknowledged">Acknowledged</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {data?.data.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No alerts"
              description={activeTab === 'unread' ? 'All caught up! No unread alerts.' : 'No alerts match your filters.'}
            />
          ) : (
          <AnimatePresence mode="popLayout">
            {data?.data.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={alert.severity === 'CRITICAL' && !alert.acknowledged ? 'border-red-500 bg-red-50 dark:bg-red-950/10' : ''}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-start gap-4">
                      <motion.div 
                        className={`mt-1 rounded-full p-2 ${
                          alert.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 
                          alert.severity === 'WARNING' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 
                          'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                        animate={alert.severity === 'CRITICAL' && !alert.acknowledged ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <AlertOctagon className="h-5 w-5" />
                      </motion.div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge variant={alert.severity === 'CRITICAL' ? 'destructive' : 'outline'}>
                            {alert.severity}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Acknowledged
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{alert.event.device.name}</span>
                          <span>{format(new Date(alert.createdAt), 'PPpp')}</span>
                        </div>
                      </div>
                    </div>
                    {!alert.acknowledged && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => acknowledgeMutation.mutate(alert.id)}
                        disabled={acknowledgeMutation.isPending}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span className="flex items-center px-4">
          Page {data?.meta.page} of {data?.meta.totalPages}
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= (data?.meta.totalPages || 1)}
        >
          Next
        </Button>
      </div>
      </div>
    </PageTransition>
  );
}
