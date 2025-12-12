import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Bell,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

export default function SystemLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['all-alerts'],
    queryFn: () => base44.entities.AlertLog.list('-created_date', 500)
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.target?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.case_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || alert.alert_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter) {
      const alertDate = format(new Date(alert.created_date), 'yyyy-MM-dd');
      matchesDate = alertDate === dateFilter;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const stats = {
    total: alerts.length,
    sent: alerts.filter(a => a.status === 'sent').length,
    failed: alerts.filter(a => a.status === 'failed').length,
    pending: alerts.filter(a => a.status === 'pending').length,
    authority: alerts.filter(a => a.alert_type === 'authority_alert').length,
    user: alerts.filter(a => a.alert_type === 'user_notification').length
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-3.5 h-3.5" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-emerald-100 text-emerald-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Logs</h1>
          <p className="text-slate-500 mt-1">Complete alert log history</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total Logs</p>
        </Card>
        <Card className="p-4 text-center bg-emerald-50 border-emerald-100">
          <p className="text-2xl font-bold text-emerald-700">{stats.sent}</p>
          <p className="text-xs text-emerald-600 mt-1">Sent</p>
        </Card>
        <Card className="p-4 text-center bg-red-50 border-red-100">
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
          <p className="text-xs text-red-600 mt-1">Failed</p>
        </Card>
        <Card className="p-4 text-center bg-amber-50 border-amber-100">
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
          <p className="text-xs text-amber-600 mt-1">Pending</p>
        </Card>
        <Card className="p-4 text-center bg-purple-50 border-purple-100">
          <p className="text-2xl font-bold text-purple-700">{stats.authority}</p>
          <p className="text-xs text-purple-600 mt-1">Authority</p>
        </Card>
        <Card className="p-4 text-center bg-blue-50 border-blue-100">
          <p className="text-2xl font-bold text-blue-700">{stats.user}</p>
          <p className="text-xs text-blue-600 mt-1">User</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by target, message, or case ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Alert Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="authority_alert">Authority Alert</SelectItem>
                <SelectItem value="user_notification">User Notification</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full md:w-[180px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No logs found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} className="hover:bg-slate-50">
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={alert.alert_type === 'authority_alert' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                          }
                        >
                          {alert.alert_type === 'authority_alert' ? (
                            <><Shield className="w-3 h-3 mr-1" /> Authority</>
                          ) : (
                            <><User className="w-3 h-3 mr-1" /> User</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 max-w-[150px] truncate">
                        {alert.target}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-slate-600 line-clamp-2">{alert.message}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500">
                        {alert.case_id?.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge className={`gap-1 ${getStatusColor(alert.status)}`}>
                          {getStatusIcon(alert.status)}
                          {alert.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm whitespace-nowrap">
                        {format(new Date(alert.created_date), 'MMM d, HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-slate-500 text-center">
        Showing {filteredAlerts.length} of {alerts.length} log entries
      </div>
    </div>
  );
}