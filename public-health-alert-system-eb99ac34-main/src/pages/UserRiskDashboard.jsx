import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Users, 
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin,
  Activity,
  RefreshCw,
  Search,
  Target,
  Award,
  Info
} from 'lucide-react';
import { format } from 'date-fns';

export default function UserRiskDashboard() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState('');

  const { data: cases = [] } = useQuery({
    queryKey: ['hospital-cases'],
    queryFn: () => base44.entities.HospitalInput.list('-created_date', 100)
  });

  const { data: riskScores = [], isLoading, refetch } = useQuery({
    queryKey: ['user-risk-scores'],
    queryFn: () => base44.entities.UserRiskScore.list('-exposure_intensity_score', 200)
  });

  const filteredScores = riskScores.filter(score => {
    const matchesSearch = score.uid?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'all' || score.overall_risk_level === riskFilter;
    const matchesCase = !selectedCase || score.case_id === selectedCase;
    return matchesSearch && matchesRisk && matchesCase;
  });

  const stats = {
    total: riskScores.length,
    low: riskScores.filter(s => s.overall_risk_level === 'low').length,
    medium: riskScores.filter(s => s.overall_risk_level === 'medium').length,
    high: riskScores.filter(s => s.overall_risk_level === 'high').length,
    critical: riskScores.filter(s => s.overall_risk_level === 'critical').length
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority) => {
    const config = {
      advisory: 'bg-blue-100 text-blue-700',
      standard: 'bg-slate-100 text-slate-700',
      urgent: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return config[priority] || config.standard;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-emerald-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Risk Dashboard</h1>
          <p className="text-slate-500 mt-1">Individual exposure level assessments</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 mt-1">Total Users</p>
        </Card>
        <Card className="p-4 text-center bg-emerald-50 border-emerald-100">
          <p className="text-2xl font-bold text-emerald-700">{stats.low}</p>
          <p className="text-xs text-emerald-600 mt-1">Low Risk</p>
        </Card>
        <Card className="p-4 text-center bg-yellow-50 border-yellow-100">
          <p className="text-2xl font-bold text-yellow-700">{stats.medium}</p>
          <p className="text-xs text-yellow-600 mt-1">Medium Risk</p>
        </Card>
        <Card className="p-4 text-center bg-orange-50 border-orange-100">
          <p className="text-2xl font-bold text-orange-700">{stats.high}</p>
          <p className="text-xs text-orange-600 mt-1">High Risk</p>
        </Card>
        <Card className="p-4 text-center bg-red-50 border-red-100">
          <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
          <p className="text-xs text-red-600 mt-1">Critical</p>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by User ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by case" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Cases</SelectItem>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_type?.replace('_', ' ')} - {format(new Date(c.created_date), 'MMM d')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-full md:w-[160px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Risk Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScores.slice(0, 9).map((score) => {
          const caseData = cases.find(c => c.id === score.case_id);
          return (
            <Card key={score.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">User ID</p>
                    <p className="font-mono font-semibold text-slate-900">{score.uid}</p>
                  </div>
                  <Badge className={`${getRiskColor(score.overall_risk_level)} border px-3 py-1`}>
                    {score.overall_risk_level.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall Exposure Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">Exposure Intensity</span>
                    <span className={`text-2xl font-bold ${getScoreColor(score.exposure_intensity_score || 0)}`}>
                      {Math.round(score.exposure_intensity_score || 0)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        (score.exposure_intensity_score || 0) >= 80 ? 'bg-red-500' :
                        (score.exposure_intensity_score || 0) >= 60 ? 'bg-orange-500' :
                        (score.exposure_intensity_score || 0) >= 40 ? 'bg-yellow-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${score.exposure_intensity_score || 0}%` }}
                    />
                  </div>
                </div>

                {/* Component Scores */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Duration
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{score.duration_minutes || 0} min</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(score.duration_score || 0)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Distance
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{score.distance_meters || 0} m</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(score.distance_score || 0)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      Crowd Intensity
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{score.crowd_intensity || 0}%</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(score.density_score || 0)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Notification Priority */}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Notification Priority</span>
                    <Badge className={getPriorityBadge(score.notification_priority)}>
                      {score.notification_priority?.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {/* Risk Factors */}
                {score.risk_factors && score.risk_factors.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-slate-500 mb-2">Risk Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {score.risk_factors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Case Info */}
                {caseData && (
                  <div className="pt-3 border-t text-xs text-slate-500">
                    Case: {caseData.case_type?.replace('_', ' ')} 
                    {caseData.severity_level && ` (${caseData.severity_level})`}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Full Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Risk Assessments</CardTitle>
          <CardDescription>Complete list of user risk scores</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredScores.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No risk scores found</p>
              <p className="text-sm mt-1">Risk scores are generated during case processing</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>User ID</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Exposure Score</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Crowd</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredScores.map((score) => (
                    <TableRow key={score.id} className="hover:bg-slate-50">
                      <TableCell className="font-mono text-sm">{score.uid}</TableCell>
                      <TableCell>
                        <Badge className={`${getRiskColor(score.overall_risk_level)} border`}>
                          {score.overall_risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (score.exposure_intensity_score || 0) >= 80 ? 'bg-red-500' :
                                (score.exposure_intensity_score || 0) >= 60 ? 'bg-orange-500' :
                                (score.exposure_intensity_score || 0) >= 40 ? 'bg-yellow-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${score.exposure_intensity_score || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold">{Math.round(score.exposure_intensity_score || 0)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {score.duration_minutes || 0} min
                        <br />
                        <span className="text-xs text-slate-500">
                          score: {Math.round(score.duration_score || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {score.distance_meters || 0} m
                        <br />
                        <span className="text-xs text-slate-500">
                          score: {Math.round(score.distance_score || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {score.crowd_intensity || 0}%
                        <br />
                        <span className="text-xs text-slate-500">
                          score: {Math.round(score.density_score || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityBadge(score.notification_priority)}>
                          {score.notification_priority}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Scoring Explanation */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Risk Scoring Algorithm</h3>
              <p className="text-sm text-slate-600 mt-1 mb-3">
                Individual risk scores are calculated based on three key factors:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">Duration Score</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    How long the user stayed in the hotspot area. Longer exposure = higher score.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm">Distance Score</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Proximity to contamination source. Closer distance = higher score.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">Density Score</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Crowd intensity during presence. Higher density = higher transmission risk.
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                <strong>Notification Priority:</strong> High-risk users receive urgent alerts, 
                medium-risk get standard notifications, and low-risk receive advisory messages.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}