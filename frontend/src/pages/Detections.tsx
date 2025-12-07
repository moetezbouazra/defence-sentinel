import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDetections, getDetectionStats } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Detection, PaginatedResponse } from '@/types';

export default function Detections() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<PaginatedResponse<Detection>>({
    queryKey: ['detections', page],
    queryFn: () => getDetections({ page, limit: 20 }),
  });

  const { data: stats } = useQuery({
    queryKey: ['detection-stats'],
    queryFn: getDetectionStats,
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
      <h1 className="text-3xl font-bold tracking-tight">Detections</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        {/* Add more stats cards here */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Detections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Threat Level</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data.map((detection) => (
                <TableRow key={detection.id}>
                  <TableCell className="font-medium capitalize">{detection.className}</TableCell>
                  <TableCell>{(detection.confidence * 100).toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge variant={detection.threatLevel === 'CRITICAL' ? 'destructive' : 'outline'}>
                      {detection.threatLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(detection.createdAt), 'PPpp')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
