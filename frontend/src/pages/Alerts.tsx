import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, acknowledgeAlert } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle, AlertOctagon } from 'lucide-react';
import { format } from 'date-fns';
import type { PaginatedResponse } from '@/types';

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
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
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
          {data?.data.map((alert) => (
            <Card key={alert.id} className={alert.severity === 'CRITICAL' && !alert.acknowledged ? 'border-red-500 bg-red-50 dark:bg-red-950/10' : ''}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 rounded-full p-2 ${
                    alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 
                    alert.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <AlertOctagon className="h-5 w-5" />
                  </div>
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
          ))}
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
  );
}
