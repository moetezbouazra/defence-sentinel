import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEvents } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Loader2, Camera, User } from 'lucide-react';
import type { Event, PaginatedResponse } from '@/types';

export default function Events() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery<PaginatedResponse<Event>>({
    queryKey: ['events', page],
    queryFn: () => getEvents({ page, limit: 12 }),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Failed to load events</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <div className="flex gap-2">
          {/* Filters will go here */}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.data.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

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

function EventCard({ event }: { event: Event }) {
  const [showAnnotated, setShowAnnotated] = useState(true);
  const personCount = event.detections.filter((d) => d.className === 'person').length;
  const maxThreat = event.detections.reduce((max, d) => {
    const levels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    return (levels[d.threatLevel] || 0) > (levels[max as keyof typeof levels] || 0) ? d.threatLevel : max;
  }, 'LOW');

  const threatColor = {
    LOW: 'bg-green-500',
    MEDIUM: 'bg-yellow-500',
    HIGH: 'bg-orange-500',
    CRITICAL: 'bg-red-500',
  }[maxThreat] || 'bg-gray-500';

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="cursor-pointer overflow-hidden transition-all hover:shadow-lg">
          <div className="relative aspect-video bg-muted">
            {event.thumbnailUrl ? (
              <img
                src={event.thumbnailUrl}
                alt={`Event ${event.id}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Camera className="h-8 w-8" />
              </div>
            )}
            <div className="absolute right-2 top-2">
              <Badge className={threatColor}>{maxThreat}</Badge>
            </div>
            {personCount > 0 && (
              <div className="absolute left-2 bottom-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white">
                <User className="h-3 w-3" />
                {personCount}
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{event.device.name}</div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(event.timestamp), 'HH:mm:ss')}
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {event.detections.length} detections
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="relative aspect-video bg-muted overflow-hidden rounded-lg border">
               {(showAnnotated ? event.thumbnailUrl : event.imageUrl) ? (
                <img
                  src={(showAnnotated ? event.thumbnailUrl : event.imageUrl) || ''}
                  alt={`Event ${event.id}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
            </div>
            <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={() => setShowAnnotated(!showAnnotated)}>
                    {showAnnotated ? "Show Original" : "Show Annotated"}
                </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Detections</h3>
              <div className="mt-2 space-y-2">
                {event.detections.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <span>{d.className}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{(d.confidence * 100).toFixed(0)}%</Badge>
                      <Badge>{d.threatLevel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Metadata</h3>
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Device: {event.device.name} ({event.deviceId})</p>
                <p>Time: {format(new Date(event.timestamp), 'PPpp')}</p>
                <p>Type: {event.type}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
