import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Shield, 
  Heart, 
  Utensils,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import SeverityBadge from '@/components/cases/SeverityBadge';

export default function AuthoritiesView() {
  const [activeTab, setActiveTab] = useState('red_crescent');

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['authority-alerts'],
    queryFn: () => base44.entities.AlertLog.filter({ alert_type: 'authority_alert' }, '-created_date', 100)
  });

  const redCrescentAlerts = alerts.filter(a => a.target_type === 'red_crescent');
  const restaurantAlerts = alerts.filter(a => a.target_type === 'restaurant_authority');

  const renderAlertTable = (alertList) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>Case Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alertList.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {alert.case_type?.replace('_', ' ') || 'Unknown'}
                </Badge>
              </TableCell>
              <TableCell>
                <SeverityBadge severity={alert.severity_level || 'medium'} />
              </TableCell>
              <TableCell className="max-w-md">
                <p className="text-sm text-slate-600 line-clamp-2">{alert.message}</p>
              </TableCell>
              <TableCell>
                <Badge className={alert.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                  {alert.status === 'sent' ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Sent</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" /> {alert.status}</>
                  )}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {format(new Date(alert.created_date), 'PPp')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Authorities View</h1>
        <p className="text-slate-500 mt-1">Alerts sent to external authorities</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Red Crescent / EMS</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{redCrescentAlerts.length}</p>
                <p className="text-sm text-slate-500 mt-1">Heat stroke & emergency alerts</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Restaurant Authority</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{restaurantAlerts.length}</p>
                <p className="text-sm text-slate-500 mt-1">Food poisoning alerts</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Utensils className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="red_crescent" className="gap-2">
                <Heart className="w-4 h-4" />
                Red Crescent
              </TabsTrigger>
              <TabsTrigger value="restaurant" className="gap-2">
                <Utensils className="w-4 h-4" />
                Restaurant Authority
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
              </div>
            ) : (
              <>
                <TabsContent value="red_crescent" className="mt-0">
                  {redCrescentAlerts.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Heart className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No Red Crescent alerts</p>
                      <p className="text-sm mt-1">Heat stroke cases will trigger alerts here</p>
                    </div>
                  ) : (
                    renderAlertTable(redCrescentAlerts)
                  )}
                </TabsContent>
                <TabsContent value="restaurant" className="mt-0">
                  {restaurantAlerts.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Utensils className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="font-medium">No Restaurant Authority alerts</p>
                      <p className="text-sm mt-1">Food poisoning cases will trigger alerts here</p>
                    </div>
                  ) : (
                    renderAlertTable(restaurantAlerts)
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Information Card */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Alert Routing Logic</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                <li>• <strong>Heat Stroke</strong> cases → Red Crescent / EMS notification</li>
                <li>• <strong>Food Poisoning</strong> cases → Restaurant Regulatory Authority notification</li>
                <li>• All alerts are logged with case details and timestamps</li>
                <li>• External APIs would be called in production (simulated in this prototype)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}