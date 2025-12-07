import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEvents, getDevices } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays } from 'date-fns';
import { Loader2, Camera, User, Filter, X, Grid3x3, List, Calendar, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { Event, PaginatedResponse } from '@/types';
import { toast } from 'react-hot-toast';
import { EventsGridSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { LazyImage } from '@/components/ui/lazy-image';
import PageTransition, { staggerContainer, staggerItem, cardHover } from '@/components/PageTransition';

type ViewMode = 'grid' | 'list' | 'timeline';

export default function Events() {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    deviceId: 'all',
    type: 'all',
    threatLevel: 'all',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  const { data: devices } = useQuery({
    queryKey: ['devices'],
    queryFn: getDevices,
  });

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Event>>({
    queryKey: ['events', page, filters],
    queryFn: () => {
      const params: any = { page, limit: viewMode === 'grid' ? 12 : 20 };
      if (filters.deviceId && filters.deviceId !== 'all') params.deviceId = filters.deviceId;
      if (filters.type && filters.type !== 'all') params.type = filters.type;
      if (filters.threatLevel && filters.threatLevel !== 'all') params.threatLevel = filters.threatLevel;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      return getEvents(params);
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      deviceId: 'all',
      type: 'all',
      threatLevel: 'all',
      startDate: '',
      endDate: '',
    });
    setPage(1);
    toast.success(t('filtersCleared'));
  };

  const setQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    setFilters({
      ...filters,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          </div>
        </div>
        <EventsGridSkeleton count={viewMode === 'grid' ? 12 : 20} />
      </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-red-500">Failed to load events</div>;
  }

  return (
    <PageTransition>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.meta.total || 0} total events
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {Object.values(filters).some(v => v) && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(v => v).length}
              </Badge>
            )}
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none border-r-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-r-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('timeline')}
              className="rounded-l-none"
            >
              <Clock className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Device</label>
                  <Select value={filters.deviceId} onValueChange={(v) => handleFilterChange('deviceId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All devices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All devices</SelectItem>
                      {devices?.map((device: any) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Type</label>
                  <Select value={filters.type} onValueChange={(v) => handleFilterChange('type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="MOTION">Motion</SelectItem>
                      <SelectItem value="DETECTION">Detection</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Threat Level</label>
                  <Select value={filters.threatLevel} onValueChange={(v) => handleFilterChange('threatLevel', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All levels</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Date Range</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setQuickDateRange(1)}>
                      Today
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
                      7d
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
                      30d
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear all filters
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Grid/List/Timeline */}
      {data?.data.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No events found"
          description="Try adjusting your filters or wait for motion to be detected on one of your cameras."
          action={{
            label: 'Clear Filters',
            onClick: clearFilters,
          }}
        />
      ) : viewMode === 'grid' ? (
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {data?.data.map((event) => (
            <motion.div key={event.id} variants={staggerItem}>
              <EventCard event={event} />
            </motion.div>
          ))}
        </motion.div>
      ) : viewMode === 'timeline' ? (
        <TimelineView events={data?.data || []} />
      ) : (
        <Card>
          <div className="divide-y">
            {data?.data.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <EventListItem event={event} />
              </motion.div>
            ))}
          </div>
        </Card>
      )}

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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const imageUrl = event.thumbnailUrl?.startsWith('data:') 
    ? event.thumbnailUrl 
    : `${API_URL.replace('/api', '')}${event.thumbnailUrl}`;
  const fullImageUrl = event.imageUrl?.startsWith('data:')
    ? event.imageUrl
    : `${API_URL.replace('/api', '')}${event.imageUrl}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          variants={cardHover}
          initial="rest"
          whileHover="hover"
        >
          <Card className="cursor-pointer overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {imageUrl ? (
                <LazyImage
                  src={imageUrl}
                  alt={`Event ${event.id}`}
                  className="rounded-t-lg"
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute left-2 bottom-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm"
                >
                  <User className="h-3 w-3" />
                  {personCount}
                </motion.div>
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
        </motion.div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <div className="relative aspect-video bg-muted overflow-hidden rounded-lg border">
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <Button size="sm" variant="secondary" onClick={() => zoomIn()}>
                        +
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => zoomOut()}>
                        -
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => resetTransform()}>
                        Reset
                      </Button>
                    </div>
                    <TransformComponent>
                      {(showAnnotated ? imageUrl : fullImageUrl) ? (
                        <img
                          src={(showAnnotated ? imageUrl : fullImageUrl) || ''}
                          alt={`Event ${event.id}`}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
            <div className="flex justify-center gap-2">
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
                    <span className="capitalize">{d.className}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{(d.confidence * 100).toFixed(0)}%</Badge>
                      <Badge className={
                        d.threatLevel === 'CRITICAL' ? 'bg-rose-500' :
                        d.threatLevel === 'HIGH' ? 'bg-orange-500' :
                        d.threatLevel === 'MEDIUM' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }>{d.threatLevel}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Metadata</h3>
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                <p><strong>Device:</strong> {event.device.name}</p>
                <p><strong>Time:</strong> {format(new Date(event.timestamp), 'PPpp')}</p>
                <p><strong>Type:</strong> {event.type}</p>
                <p><strong>Status:</strong> {event.status}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EventListItem({ event }: { event: Event }) {
  const personCount = event.detections.filter((d) => d.className === 'person').length;
  const maxThreat = event.detections.reduce((max, d) => {
    const levels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
    return (levels[d.threatLevel] || 0) > (levels[max as keyof typeof levels] || 0) ? d.threatLevel : max;
  }, 'LOW');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-4">
          <div className="w-24 h-16 bg-muted rounded overflow-hidden shrink-0">
            {event.thumbnailUrl ? (
              <img src={event.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Camera className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{event.device.name}</h3>
              <Badge className={
                maxThreat === 'CRITICAL' ? 'bg-rose-500' :
                maxThreat === 'HIGH' ? 'bg-orange-500' :
                maxThreat === 'MEDIUM' ? 'bg-amber-500' :
                'bg-emerald-500'
              }>{maxThreat}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {event.detections.length} detections
              {personCount > 0 && ` • ${personCount} person${personCount > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="text-sm text-muted-foreground text-right">
            <p>{format(new Date(event.timestamp), 'PP')}</p>
            <p>{format(new Date(event.timestamp), 'p')}</p>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <EventCard event={event} />
      </DialogContent>
    </Dialog>
  );
}

function TimelineView({ events }: { events: Event[] }) {
  const groupedByDate = events.reduce((acc, event) => {
    const date = format(new Date(event.timestamp), 'PP');
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <div className="space-y-8">
      {Object.entries(groupedByDate).map(([date, dayEvents]) => (
        <motion.div
          key={date}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative pl-8 border-l-2 border-muted"
        >
          <div className="sticky top-20 -left-4 w-fit bg-background px-3 py-1 rounded-full border mb-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              {date}
            </div>
          </div>
          <div className="space-y-4">
            {dayEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <div className="absolute -left-[41px] top-6 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                <TimelineEventCard event={event} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TimelineEventCard({ event }: { event: Event }) {
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

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const imageUrl = event.thumbnailUrl?.startsWith('data:') 
    ? event.thumbnailUrl 
    : `${API_URL.replace('/api', '')}${event.thumbnailUrl}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ x: 4 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-32 h-24 bg-muted rounded overflow-hidden shrink-0">
                  {imageUrl ? (
                    <LazyImage
                      src={imageUrl}
                      alt={`Event ${event.id}`}
                      aspectRatio="aspect-[4/3]"
                      className="rounded"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Camera className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{event.device.name}</h4>
                      <Badge className={threatColor} variant="secondary">{maxThreat}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.timestamp), 'p')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.detections.length} detection{event.detections.length !== 1 ? 's' : ''}
                    {personCount > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {personCount} person{personCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {event.detections.slice(0, 3).map((d, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {d.className} {(d.confidence * 100).toFixed(0)}%
                      </Badge>
                    ))}
                    {event.detections.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{event.detections.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <EventCard event={event} />
      </DialogContent>
    </Dialog>
  );
}

