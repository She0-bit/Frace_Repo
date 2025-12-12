import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { 
  Search, 
  Filter, 
  FileText, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import StatusBadge from '@/components/cases/StatusBadge';
import CaseTypeBadge from '@/components/cases/CaseTypeBadge';
import SeverityBadge from '@/components/cases/SeverityBadge';
import { format } from 'date-fns';

export default function CasesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ['hospital-cases'],
    queryFn: () => base44.entities.HospitalInput.list('-created_date', 100)
  });

  const filteredCases = cases.filter(c => {
    const matchesSearch = 
      c.hospital_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.suspected_source_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.suspected_source_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.case_type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cases List</h1>
          <p className="text-slate-500 mt-1">All reported medical incidents</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Link to={createPageUrl('NewCase')}>
            <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
              <FileText className="w-4 h-4" />
              New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by hospital ID or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending_check">Pending Check</SelectItem>
                <SelectItem value="no_alert_needed">No Alert Needed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="alerts_generated">Alerts Generated</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Case Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="heat_stroke">Heat Stroke</SelectItem>
                <SelectItem value="food_poisoning">Food Poisoning</SelectItem>
                <SelectItem value="respiratory_illness">Respiratory Illness</SelectItem>
                <SelectItem value="waterborne_disease">Waterborne Disease</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No cases found</p>
              <p className="text-sm mt-1">Try adjusting your filters or create a new case</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Case Type</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Event Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((c) => (
                    <TableRow key={c.id} className="hover:bg-slate-50">
                      <TableCell>
                        <CaseTypeBadge caseType={c.case_type} />
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {c.hospital_id}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {c.suspected_source_name || c.suspected_source_id || '—'}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={c.severity_level} />
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {c.event_time ? format(new Date(c.event_time), 'MMM d, yyyy HH:mm') : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={createPageUrl('CaseDetails') + `?id=${c.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1.5">
                            View <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['pending_check', 'no_alert_needed', 'processing', 'alerts_generated', 'closed'].map((status) => {
          const count = cases.filter(c => c.status === status).length;
          return (
            <Card key={status} className="text-center p-4">
              <div className="text-2xl font-bold text-slate-900">{count}</div>
              <StatusBadge status={status} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}