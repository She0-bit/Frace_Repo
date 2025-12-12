import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Plus, 
  Users,
  Trash2,
  RefreshCw,
  Database
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LocationData() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({
    uid: '',
    timestamp: '',
    location_id: '',
    location_name: '',
    gps_lat: '',
    gps_lng: ''
  });

  const { data: locationData = [], isLoading, refetch } = useQuery({
    queryKey: ['location-tracking'],
    queryFn: () => base44.entities.LocationTracking.list('-timestamp', 200)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LocationTracking.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['location-tracking']);
      setIsDialogOpen(false);
      setNewLocation({
        uid: '',
        timestamp: '',
        location_id: '',
        location_name: '',
        gps_lat: '',
        gps_lng: ''
      });
      toast.success('Location record added');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LocationTracking.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['location-tracking']);
      toast.success('Record deleted');
    }
  });

  const generateSampleData = async () => {
    const sampleLocations = [
      { location_id: 'REST-001', location_name: 'Downtown Restaurant', gps_lat: 24.7136, gps_lng: 46.6753 },
      { location_id: 'REST-002', location_name: 'Beachside Cafe', gps_lat: 24.4539, gps_lng: 54.3773 },
      { location_id: 'EVENT-001', location_name: 'City Park Event', gps_lat: 24.7241, gps_lng: 46.6789 },
      { location_id: 'MALL-001', location_name: 'Central Shopping Mall', gps_lat: 24.6877, gps_lng: 46.7219 }
    ];

    const users = ['USER-001', 'USER-002', 'USER-003', 'USER-004', 'USER-005', 'USER-006', 'USER-007', 'USER-008'];
    
    const now = new Date();
    const records = [];

    for (let i = 0; i < 20; i++) {
      const randomLocation = sampleLocations[Math.floor(Math.random() * sampleLocations.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomHoursAgo = Math.floor(Math.random() * 72);
      const timestamp = new Date(now.getTime() - randomHoursAgo * 60 * 60 * 1000);

      records.push({
        uid: randomUser,
        timestamp: timestamp.toISOString(),
        location_id: randomLocation.location_id,
        location_name: randomLocation.location_name,
        gps_lat: randomLocation.gps_lat + (Math.random() - 0.5) * 0.01,
        gps_lng: randomLocation.gps_lng + (Math.random() - 0.5) * 0.01
      });
    }

    await base44.entities.LocationTracking.bulkCreate(records);
    queryClient.invalidateQueries(['location-tracking']);
    toast.success(`Generated ${records.length} sample location records`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...newLocation,
      gps_lat: parseFloat(newLocation.gps_lat) || null,
      gps_lng: parseFloat(newLocation.gps_lng) || null
    });
  };

  // Group by location
  const locationGroups = locationData.reduce((acc, loc) => {
    const key = loc.location_id;
    if (!acc[key]) {
      acc[key] = { location_id: key, location_name: loc.location_name, count: 0, records: [] };
    }
    acc[key].count++;
    acc[key].records.push(loc);
    return acc;
  }, {});

  const uniqueUsers = [...new Set(locationData.map(l => l.uid))].length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Location Tracking Data</h1>
          <p className="text-slate-500 mt-1">User location records for contact tracing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={generateSampleData} className="gap-2">
            <Database className="w-4 h-4" />
            Generate Sample Data
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Location Record</DialogTitle>
                <DialogDescription>
                  Add a new user location tracking record
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="uid">User ID</Label>
                    <Input
                      id="uid"
                      value={newLocation.uid}
                      onChange={(e) => setNewLocation({...newLocation, uid: e.target.value})}
                      placeholder="USER-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="timestamp">Timestamp</Label>
                    <Input
                      id="timestamp"
                      type="datetime-local"
                      value={newLocation.timestamp}
                      onChange={(e) => setNewLocation({...newLocation, timestamp: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location_id">Location ID</Label>
                    <Input
                      id="location_id"
                      value={newLocation.location_id}
                      onChange={(e) => setNewLocation({...newLocation, location_id: e.target.value})}
                      placeholder="REST-001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location_name">Location Name</Label>
                    <Input
                      id="location_name"
                      value={newLocation.location_name}
                      onChange={(e) => setNewLocation({...newLocation, location_name: e.target.value})}
                      placeholder="Downtown Restaurant"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gps_lat">Latitude</Label>
                    <Input
                      id="gps_lat"
                      type="number"
                      step="any"
                      value={newLocation.gps_lat}
                      onChange={(e) => setNewLocation({...newLocation, gps_lat: e.target.value})}
                      placeholder="24.7136"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gps_lng">Longitude</Label>
                    <Input
                      id="gps_lng"
                      type="number"
                      step="any"
                      value={newLocation.gps_lng}
                      onChange={(e) => setNewLocation({...newLocation, gps_lng: e.target.value})}
                      placeholder="46.6753"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Adding...' : 'Add Record'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Records</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{locationData.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Unique Users</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{uniqueUsers}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Unique Locations</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{Object.keys(locationGroups).length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Locations Summary</CardTitle>
          <CardDescription>Grouped view of tracked locations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(locationGroups).map((group) => (
              <div key={group.location_id} className="p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-900">{group.location_name || group.location_id}</span>
                </div>
                <p className="text-sm text-slate-500">ID: {group.location_id}</p>
                <p className="text-sm text-slate-500">{group.count} check-ins</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Records */}
      <Card>
        <CardHeader>
          <CardTitle>All Location Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : locationData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No location data</p>
              <p className="text-sm mt-1">Add records or generate sample data</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>User ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Coordinates</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationData.map((loc) => (
                    <TableRow key={loc.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-sm">{loc.uid}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{loc.location_name || loc.location_id}</p>
                          <p className="text-xs text-slate-500">{loc.location_id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {format(new Date(loc.timestamp), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {loc.gps_lat && loc.gps_lng 
                          ? `${loc.gps_lat.toFixed(4)}, ${loc.gps_lng.toFixed(4)}`
                          : '—'
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteMutation.mutate(loc.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}