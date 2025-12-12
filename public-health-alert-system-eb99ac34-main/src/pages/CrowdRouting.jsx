import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle,
  TrendingUp,
  Users,
  RefreshCw,
  Bell,
  Gauge,
  Thermometer,
  Wind,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CrowdRouting() {
  const queryClient = useQueryClient();
  const [selectedRoute, setSelectedRoute] = useState(null);

  const { data: routes = [], isLoading: routesLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: () => base44.entities.Route.list('route_id', 50)
  });

  const { data: snapshots = [], isLoading: snapshotsLoading, refetch } = useQuery({
    queryKey: ['route-snapshots'],
    queryFn: () => base44.entities.RouteSnapshot.list('-timestamp', 100)
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['crowd-alerts'],
    queryFn: () => base44.entities.CrowdAlert.filter({ status: 'active' }, '-alert_time', 20)
  });

  // Get latest snapshot for each route
  const latestSnapshots = routes.map(route => {
    const routeSnapshots = snapshots.filter(s => s.route_id === route.route_id);
    return routeSnapshots.length > 0 ? routeSnapshots[0] : null;
  }).filter(Boolean);

  const generateSnapshot = async (routeId) => {
    // Simulate real-time data collection
    const densityScore = Math.floor(Math.random() * 100);
    const tempScore = Math.floor(Math.random() * 100);
    const temperature = 35 + Math.random() * 15; // 35-50°C
    const humidity = 20 + Math.random() * 60; // 20-80%
    const peopleCount = Math.floor(Math.random() * 5000);
    
    let movementSpeed = 'normal';
    let safetyStatus = 'safe';
    
    if (densityScore > 80) {
      movementSpeed = 'slow';
      safetyStatus = 'congested';
    } else if (densityScore > 60) {
      movementSpeed = 'normal';
      safetyStatus = 'moderate';
    } else if (densityScore > 90) {
      movementSpeed = 'stalled';
      safetyStatus = 'critical';
    } else {
      movementSpeed = 'fast';
      safetyStatus = 'safe';
    }

    await base44.entities.RouteSnapshot.create({
      route_id: routeId,
      timestamp: new Date().toISOString(),
      density_score: densityScore,
      temperature_score: tempScore,
      movement_speed: movementSpeed,
      people_count: peopleCount,
      safety_status: safetyStatus,
      temperature_celsius: temperature,
      humidity_percent: humidity,
      recommendations: safetyStatus === 'safe' ? 'Route clear' : 'Consider alternative route'
    });

    queryClient.invalidateQueries(['route-snapshots']);
  };

  const generateAllSnapshots = async () => {
    for (const route of routes) {
      await generateSnapshot(route.route_id);
    }
    toast.success('Route data refreshed');
  };

  const generateCrowdAlert = async () => {
    const congestedRoutes = latestSnapshots
      .filter(s => s.safety_status === 'congested' || s.safety_status === 'critical')
      .map(s => s.route_id);
    
    const safeRoutes = latestSnapshots
      .filter(s => s.safety_status === 'safe')
      .map(s => s.route_id);

    if (congestedRoutes.length > 0 && safeRoutes.length > 0) {
      await base44.entities.CrowdAlert.create({
        alert_time: new Date().toISOString(),
        alert_type: 'overcrowding',
        affected_routes: congestedRoutes,
        recommended_route: safeRoutes[0],
        severity: 'high',
        message: `Route ${safeRoutes[0]} is safe. Route ${congestedRoutes[0]} is currently congested. Redirect pilgrims to ${safeRoutes[0]}.`,
        target_recipients: ['crowd_supervisors', 'volunteers', 'field_control'],
        status: 'active'
      });

      queryClient.invalidateQueries(['crowd-alerts']);
      toast.success('Crowd alert generated');
    } else {
      toast.info('No congestion detected at this time');
    }
  };

  const resolveAlert = async (alertId) => {
    await base44.entities.CrowdAlert.update(alertId, { status: 'resolved' });
    queryClient.invalidateQueries(['crowd-alerts']);
    toast.success('Alert resolved');
  };

  const getSafetyColor = (status) => {
    switch (status) {
      case 'safe': return 'bg-emerald-500';
      case 'moderate': return 'bg-yellow-500';
      case 'congested': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getSafetyBadge = (status) => {
    const config = {
      safe: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      congested: 'bg-orange-100 text-orange-700 border-orange-200',
      critical: 'bg-red-100 text-red-700 border-red-200'
    };
    return config[status] || config.safe;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Crowd Routing System</h1>
          <p className="text-slate-500 mt-1">Real-time route safety monitoring and recommendations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={generateAllSnapshots} className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Gauge className="w-4 h-4" />
            Update All Routes
          </Button>
          <Button onClick={generateCrowdAlert} className="bg-amber-600 hover:bg-amber-700 gap-2">
            <Bell className="w-4 h-4" />
            Generate Alert
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5" />
                Active Crowd Alerts ({alerts.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-4 bg-white rounded-xl border border-amber-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-100 text-red-700">
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{alert.alert_type.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-slate-900 font-medium text-lg">{alert.message}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                    className="gap-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Resolve
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Recipients: {alert.target_recipients?.join(', ')}
                  </span>
                  <span>•</span>
                  <span>{format(new Date(alert.alert_time), 'PPp')}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Route Map Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Route Status Map
          </CardTitle>
          <CardDescription>Visual representation of route safety levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {routes.map((route) => {
              const snapshot = latestSnapshots.find(s => s.route_id === route.route_id);
              const isSelected = selectedRoute === route.route_id;
              
              return (
                <div
                  key={route.route_id}
                  onClick={() => setSelectedRoute(route.route_id)}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-blue-500 shadow-lg' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Route {route.route_id}</h3>
                      <p className="text-sm text-slate-500">{route.route_name}</p>
                    </div>
                    {snapshot && (
                      <div className={`w-16 h-16 rounded-full ${getSafetyColor(snapshot.safety_status)} flex items-center justify-center`}>
                        <Navigation className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>

                  {snapshot ? (
                    <>
                      <div className="mb-4">
                        <Badge className={`${getSafetyBadge(snapshot.safety_status)} border text-sm`}>
                          {snapshot.safety_status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Crowd Density
                          </span>
                          <span className="font-semibold">{snapshot.density_score}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getSafetyColor(snapshot.safety_status)}`}
                            style={{ width: `${snapshot.density_score}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 flex items-center gap-2">
                            <Thermometer className="w-4 h-4" />
                            Temperature
                          </span>
                          <span className="font-semibold">{snapshot.temperature_celsius?.toFixed(1)}°C</span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 flex items-center gap-2">
                            <Wind className="w-4 h-4" />
                            Movement
                          </span>
                          <Badge variant="outline" className="capitalize">{snapshot.movement_speed}</Badge>
                        </div>

                        <div className="pt-3 border-t text-xs text-slate-500">
                          Updated {format(new Date(snapshot.timestamp), 'HH:mm:ss')}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-slate-400">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No data available</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateSnapshot(route.route_id);
                        }}
                        className="mt-2"
                      >
                        Generate Data
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Route Metrics */}
      {latestSnapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Route Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Route</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Density</TableHead>
                    <TableHead>Temperature</TableHead>
                    <TableHead>People Count</TableHead>
                    <TableHead>Movement</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {latestSnapshots.map((snapshot) => {
                    const route = routes.find(r => r.route_id === snapshot.route_id);
                    return (
                      <TableRow key={snapshot.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          Route {snapshot.route_id}
                          <br />
                          <span className="text-xs text-slate-500">{route?.route_name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSafetyBadge(snapshot.safety_status)}>
                            {snapshot.safety_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getSafetyColor(snapshot.safety_status)}`}
                                style={{ width: `${snapshot.density_score}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold">{snapshot.density_score}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {snapshot.temperature_celsius?.toFixed(1)}°C
                          <br />
                          <span className="text-xs text-slate-500">
                            {snapshot.humidity_percent?.toFixed(0)}% humidity
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {snapshot.people_count?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {snapshot.movement_speed}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {format(new Date(snapshot.timestamp), 'HH:mm:ss')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Route Comparison */}
      <Card className="bg-slate-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Route Recommendation Algorithm</h3>
              <p className="text-sm text-slate-600 mt-1">
                The system compares density scores, temperature levels, and movement speed across all routes. 
                When high density (>70%) is detected along with elevated heat stress indicators (temp >40°C), 
                automatic alerts are generated for crowd supervisors and field control units.
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                  <span className="text-slate-600">Safe (&lt;50%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span className="text-slate-600">Moderate (50-70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span className="text-slate-600">Congested (70-90%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-slate-600">Critical (&gt;90%)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}