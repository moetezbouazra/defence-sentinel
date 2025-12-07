import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTimeline, getThreatDistribution, getDevicePerformance } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import PageTransition from '@/components/PageTransition';

const COLORS = {
  LOW: '#10B981',
  MEDIUM: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444',
};

export default function Analytics() {
  const [dateRange, setDateRange] = useState(7);

  const { data: timeline, isLoading: timelineLoading } = useQuery({
    queryKey: ['analytics-timeline', dateRange],
    queryFn: getTimeline,
  });

  const { data: threats, isLoading: threatsLoading } = useQuery({
    queryKey: ['analytics-threats'],
    queryFn: getThreatDistribution,
  });

  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ['analytics-devices'],
    queryFn: getDevicePerformance,
  });

  const isLoading = timelineLoading || threatsLoading || devicesLoading;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Transform threat distribution data for pie chart
  const threatChartData = threats?.map((item: any) => ({
    name: item.threatLevel,
    value: item._count.threatLevel,
  })) || [];

  // Transform timeline data
  const timelineChartData = timeline?.map((item: any) => ({
    date: format(new Date(item.date), 'MMM dd'),
    events: item.count,
  })) || [];

  // Transform device data for bar chart
  const deviceChartData = devices?.map((device: any) => ({
    name: device.name,
    events24h: device.events24h,
    total: device.totalEvents,
  })) || [];

  const handleExport = () => {
    // TODO: Implement CSV export
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Device,Events 24h,Total Events\n"
      + deviceChartData.map((d: any) => `${d.name},${d.events24h},${d.total}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageTransition>
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Advanced insights and trends</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button 
              variant={dateRange === 7 ? 'default' : 'outline'}
              onClick={() => setDateRange(7)}
              size="sm"
            >
              Last 7 Days
            </Button>
            <Button 
              variant={dateRange === 30 ? 'default' : 'outline'}
              onClick={() => setDateRange(30)}
              size="sm"
            >
              Last 30 Days
            </Button>
            <Button 
              variant={dateRange === 90 ? 'default' : 'outline'}
              onClick={() => setDateRange(90)}
              size="sm"
            >
              Last 90 Days
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Events Timeline</CardTitle>
          <CardDescription>Daily event count over the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="events" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={{ fill: '#3B82F6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Threat Distribution and Device Performance */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Threat Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Threat Distribution</CardTitle>
            <CardDescription>Breakdown by threat level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Performance Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Device Performance</CardTitle>
            <CardDescription>Events by device (last 24 hours)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deviceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="events24h" fill="#3B82F6" name="Last 24h" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Device Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle>Device Statistics</CardTitle>
          <CardDescription>Detailed device performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Device</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Events (24h)</th>
                  <th className="text-right py-3 px-4 font-medium">Total Events</th>
                  <th className="text-left py-3 px-4 font-medium">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {devices?.map((device: any) => (
                  <tr key={device.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{device.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        device.status === 'ONLINE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        device.status === 'OFFLINE' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          device.status === 'ONLINE' ? 'bg-emerald-500' :
                          device.status === 'OFFLINE' ? 'bg-gray-500' :
                          'bg-amber-500'
                        }`} />
                        {device.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">{device.events24h}</td>
                    <td className="py-3 px-4 text-right">{device.totalEvents}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">
                      {device.lastSeen ? format(new Date(device.lastSeen), 'PPpp') : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
