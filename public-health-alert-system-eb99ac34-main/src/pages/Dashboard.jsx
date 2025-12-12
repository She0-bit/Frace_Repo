import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock,
  ArrowRight,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import StatusBadge from '@/components/cases/StatusBadge';
import CaseTypeBadge from '@/components/cases/CaseTypeBadge';
import SeverityBadge from '@/components/cases/SeverityBadge';
import { format } from 'date-fns';

export default function Dashboard() {
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ['hospital-cases'],
    queryFn: () => base44.entities.HospitalInput.list('-created_date', 50)
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => base44.entities.AlertLog.list('-created_date', 50)
  });

  const { data: targetedUIDs = [] } = useQuery({
    queryKey: ['targeted-uids'],
    queryFn: () => base44.entities.TargetedUID.list('-created_date', 100)
  });

  const stats = {
    totalCases: cases.length,
    pendingCases: cases.filter(c => c.status === 'pending_check').length,
    alertsGenerated: cases.filter(c => c.status === 'alerts_generated' || c.status === 'closed').length,
    totalAlertsSent: alerts.filter(a => a.status === 'sent').length,
    usersNotified: targetedUIDs.filter(t => t.notification_sent).length
  };

  const recentCases = cases.slice(0, 5);
  const recentAlerts = alerts.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor public health alerts and case status</p>
        </div>
        <Link to={createPageUrl('NewCase')}>
          <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20">
            <FileText className="w-4 h-4 mr-2" />
            Report New Case
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Cases</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalCases}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">Pending Review</p>
                <p className="text-3xl font-bold text-amber-900 mt-1">{stats.pendingCases}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-red-50 border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Alerts Generated</p>
                <p className="text-3xl font-bold text-red-900 mt-1">{stats.alertsGenerated}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700">Users Notified</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">{stats.usersNotified}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Recent Cases</CardTitle>
            <Link to={createPageUrl('CasesList')}>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {casesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
              </div>
            ) : recentCases.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No cases reported yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCases.map((c) => (
                  <Link 
                    key={c.id} 
                    to={createPageUrl('CaseDetails') + `?id=${c.id}`}
                    className="block p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <CaseTypeBadge caseType={c.case_type} />
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-slate-600">
                        {c.suspected_source_name || c.suspected_source_id || 'Unknown location'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {c.event_time ? format(new Date(c.event_time), 'MMM d, HH:mm') : '—'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold">Recent Alerts</CardTitle>
            <Link to={createPageUrl('SystemLogs')}>
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No alerts sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                        alert.alert_type === 'authority_alert' 
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {alert.alert_type === 'authority_alert' ? 'Authority' : 'User'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                        alert.status === 'sent' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : alert.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alert.status === 'sent' && <CheckCircle className="w-3 h-3" />}
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 truncate">{alert.target}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {format(new Date(alert.created_date), 'MMM d, HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}