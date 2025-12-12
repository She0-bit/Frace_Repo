import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Building2,
  Calendar,
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Loader2,
  Play,
  Send,
  Shield
} from 'lucide-react';
import StatusBadge from '@/components/cases/StatusBadge';
import CaseTypeBadge from '@/components/cases/CaseTypeBadge';
import SeverityBadge from '@/components/cases/SeverityBadge';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function CaseDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => base44.entities.HospitalInput.filter({ id: caseId }),
    enabled: !!caseId
  });

  const { data: targetedUIDs = [] } = useQuery({
    queryKey: ['targeted-uids', caseId],
    queryFn: () => base44.entities.TargetedUID.filter({ case_id: caseId }),
    enabled: !!caseId
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['case-alerts', caseId],
    queryFn: () => base44.entities.AlertLog.filter({ case_id: caseId }),
    enabled: !!caseId
  });

  const { data: locationData = [] } = useQuery({
    queryKey: ['location-tracking'],
    queryFn: () => base44.entities.LocationTracking.list('-timestamp', 500)
  });

  const updateCaseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HospitalInput.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['case', caseId]);
      queryClient.invalidateQueries(['hospital-cases']);
    }
  });

  const currentCase = caseData?.[0];

  const runDangerCheck = async () => {
    if (!currentCase) return;
    
    setIsProcessing(true);
    
    // Step 1: Check if danger check is needed
    if (!currentCase.confirmed_case && !currentCase.abnormal_symptom_cluster) {
      await updateCaseMutation.mutateAsync({ 
        id: currentCase.id, 
        data: { status: 'no_alert_needed' } 
      });
      toast.info('No alert needed - case not confirmed and no symptom cluster');
      setIsProcessing(false);
      return;
    }

    // Update status to processing
    await updateCaseMutation.mutateAsync({ 
      id: currentCase.id, 
      data: { status: 'processing' } 
    });

    // Step 2: Cross-reference location data
    const eventTime = new Date(currentCase.event_time);
    const timeWindowHours = 24;
    const matchedUsers = locationData.filter(loc => {
      if (loc.location_id !== currentCase.suspected_source_id) return false;
      const locTime = new Date(loc.timestamp);
      const hoursDiff = Math.abs(eventTime - locTime) / (1000 * 60 * 60);
      return hoursDiff <= timeWindowHours;
    });

    // Step 3: Create targeted UIDs
    const uniqueUIDs = [...new Set(matchedUsers.map(m => m.uid))];
    for (const uid of uniqueUIDs) {
      const matchedLoc = matchedUsers.find(m => m.uid === uid);
      await base44.entities.TargetedUID.create({
        case_id: currentCase.id,
        uid: uid,
        matched_location_id: matchedLoc.location_id,
        matched_location_name: matchedLoc.location_name || matchedLoc.location_id,
        matched_timestamp: matchedLoc.timestamp,
        notification_sent: false
      });
    }

    // Step 4: Calculate User Risk Scores for each matched user
    toast.info('Calculating individual risk scores...');
    for (const uid of uniqueUIDs) {
      const userLocations = matchedUsers.filter(m => m.uid === uid);
      
      // Calculate duration (time spent in hotspot)
      const timestamps = userLocations.map(l => new Date(l.timestamp).getTime());
      const durationMinutes = timestamps.length > 1 
        ? (Math.max(...timestamps) - Math.min(...timestamps)) / (1000 * 60)
        : 15 + Math.random() * 30; // Simulate 15-45 min if single check-in

      // Calculate distance from source (simulated)
      const distanceMeters = Math.floor(Math.random() * 200); // 0-200m

      // Calculate crowd intensity at the time (simulated)
      const crowdIntensity = 40 + Math.floor(Math.random() * 50); // 40-90%

      // Calculate component scores
      const durationScore = Math.min(100, (durationMinutes / 60) * 100); // 60 min = 100%
      const distanceScore = Math.max(0, 100 - (distanceMeters / 2)); // 200m = 0%
      const densityScore = crowdIntensity;

      // Calculate overall exposure intensity
      const exposureIntensityScore = (durationScore * 0.4 + distanceScore * 0.35 + densityScore * 0.25);

      // Determine risk level
      let riskLevel = 'low';
      let notificationPriority = 'advisory';
      if (exposureIntensityScore >= 80) {
        riskLevel = 'critical';
        notificationPriority = 'critical';
      } else if (exposureIntensityScore >= 60) {
        riskLevel = 'high';
        notificationPriority = 'urgent';
      } else if (exposureIntensityScore >= 40) {
        riskLevel = 'medium';
        notificationPriority = 'standard';
      }

      // Determine risk factors
      const riskFactors = [];
      if (durationMinutes > 30) riskFactors.push('Extended exposure');
      if (distanceMeters < 50) riskFactors.push('Close proximity');
      if (crowdIntensity > 70) riskFactors.push('High crowd density');
      if (currentCase.severity_level === 'critical' || currentCase.severity_level === 'high') {
        riskFactors.push('High severity case');
      }

      await base44.entities.UserRiskScore.create({
        case_id: currentCase.id,
        uid: uid,
        duration_minutes: Math.round(durationMinutes),
        distance_meters: distanceMeters,
        crowd_intensity: crowdIntensity,
        duration_score: durationScore,
        distance_score: distanceScore,
        density_score: densityScore,
        exposure_intensity_score: exposureIntensityScore,
        overall_risk_level: riskLevel,
        notification_priority: notificationPriority,
        risk_factors: riskFactors
      });
    }

    // Step 5: Generate Predictive Spread Model
    toast.info('Generating risk spread predictions...');
    const zones = [
      { id: 'ZONE-A', name: 'North District', lat: 24.7241, lng: 46.6789 },
      { id: 'ZONE-B', name: 'East Quarter', lat: 24.7136, lng: 46.6853 },
      { id: 'ZONE-C', name: 'Central Plaza', lat: 24.7050, lng: 46.6700 }
    ];

    for (const hours of [1, 2, 3]) {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      const baseProbability = 30 + Math.random() * 50;
      const densityFactor = uniqueUIDs.length > 5 ? 1.2 : 1.0;
      const heatFactor = currentCase.case_type === 'heat_stroke' ? 1.3 : 1.0;
      const probability = Math.min(95, baseProbability * densityFactor * heatFactor);
      
      let riskLevel = 'low';
      if (probability > 75) riskLevel = 'critical';
      else if (probability > 60) riskLevel = 'high';
      else if (probability > 40) riskLevel = 'medium';

      await base44.entities.PredictiveSpread.create({
        case_id: currentCase.id,
        prediction_time: new Date().toISOString(),
        forecast_hours: hours,
        predicted_zone: zone.id,
        predicted_zone_name: zone.name,
        probability_percent: Math.round(probability),
        risk_level: riskLevel,
        contributing_factors: {
          density_trend: uniqueUIDs.length > 5 ? 'increasing' : 'stable',
          time_overlap: Math.round(Math.random() * 50),
          heat_index: 35 + Math.random() * 15,
          humidity: 30 + Math.random() * 50,
          wind_speed: 5 + Math.random() * 15,
          crowd_movement: ['northward', 'southward', 'dispersing'][Math.floor(Math.random() * 3)]
        },
        gps_lat: zone.lat,
        gps_lng: zone.lng
      });
    }

    // Step 6: Check for Crowd Routing Alerts (if heat-related and high density)
    if (currentCase.case_type === 'heat_stroke' && uniqueUIDs.length > 5) {
      toast.info('Generating crowd routing alerts...');
      await base44.entities.CrowdAlert.create({
        alert_time: new Date().toISOString(),
        alert_type: 'heat_stress',
        affected_routes: ['Route A'],
        recommended_route: 'Route B',
        severity: currentCase.severity_level,
        message: `Heat stress detected at ${currentCase.suspected_source_name}. High density with ${uniqueUIDs.length} affected individuals. Recommend diverting crowds to alternative routes.`,
        target_recipients: ['crowd_supervisors', 'volunteers', 'field_control', 'ems'],
        status: 'active',
        linked_case_id: currentCase.id
      });
    }

    // Step 7: Create authority alerts based on case type
    if (currentCase.case_type === 'heat_stroke') {
      await base44.entities.AlertLog.create({
        case_id: currentCase.id,
        alert_type: 'authority_alert',
        target: 'Red Crescent / EMS',
        target_type: 'red_crescent',
        message: `HEAT STROKE ALERT: ${currentCase.patient_count || 1} patient(s) reported at ${currentCase.suspected_source_name || currentCase.suspected_source_id}. Severity: ${currentCase.severity_level}. Event time: ${format(eventTime, 'PPpp')}`,
        status: 'sent',
        case_type: currentCase.case_type,
        severity_level: currentCase.severity_level
      });
    }

    if (currentCase.case_type === 'food_poisoning') {
      await base44.entities.AlertLog.create({
        case_id: currentCase.id,
        alert_type: 'authority_alert',
        target: 'Restaurant Regulatory Authority',
        target_type: 'restaurant_authority',
        message: `FOOD POISONING ALERT: ${currentCase.patient_count || 1} case(s) linked to ${currentCase.suspected_source_name || currentCase.suspected_source_id}. Immediate inspection recommended. Severity: ${currentCase.severity_level}`,
        status: 'sent',
        case_type: currentCase.case_type,
        severity_level: currentCase.severity_level
      });
    }

    // Step 8: Create user notifications with risk-based messaging
    toast.info('Sending risk-based notifications...');
    const refreshedUIDs = await base44.entities.TargetedUID.filter({ case_id: currentCase.id });
    const riskScores = await base44.entities.UserRiskScore.filter({ case_id: currentCase.id });
    
    for (const targeted of refreshedUIDs) {
      const userRisk = riskScores.find(r => r.uid === targeted.uid);
      let alertMessage = '';
      
      if (userRisk) {
        if (userRisk.overall_risk_level === 'critical' || userRisk.overall_risk_level === 'high') {
          alertMessage = `⚠️ HIGH RISK ALERT: Your exposure level is ${userRisk.overall_risk_level.toUpperCase()} due to extended stay (${userRisk.duration_minutes} min) in a high-density zone. You may have been exposed to ${currentCase.case_type.replace('_', ' ')} at ${currentCase.suspected_source_name || currentCase.suspected_source_id}. Please seek medical attention and monitor for symptoms immediately.`;
        } else if (userRisk.overall_risk_level === 'medium') {
          alertMessage = `⚠️ HEALTH ALERT: You may have been exposed to ${currentCase.case_type.replace('_', ' ')} at ${currentCase.suspected_source_name || currentCase.suspected_source_id} on ${format(eventTime, 'PPP')}. Your exposure risk is MEDIUM. Please monitor for symptoms and follow health guidelines.`;
        } else {
          alertMessage = `ℹ️ ADVISORY: You were near a reported ${currentCase.case_type.replace('_', ' ')} incident at ${currentCase.suspected_source_name || currentCase.suspected_source_id}. Your risk level is LOW. Stay informed and monitor for symptoms as a precaution.`;
        }
      } else {
        alertMessage = `HEALTH ALERT: You may have been exposed to ${currentCase.case_type.replace('_', ' ')} at ${currentCase.suspected_source_name || currentCase.suspected_source_id} on ${format(eventTime, 'PPP')}. Please monitor for symptoms and follow health guidelines.`;
      }
      
      await base44.entities.AlertLog.create({
        case_id: currentCase.id,
        alert_type: 'user_notification',
        target: targeted.uid,
        target_type: 'user',
        message: alertMessage,
        status: 'sent',
        case_type: currentCase.case_type,
        severity_level: currentCase.severity_level
      });
      
      await base44.entities.TargetedUID.update(targeted.id, { notification_sent: true });
    }

    // Step 9: Mark case as alerts generated
    await updateCaseMutation.mutateAsync({ 
      id: currentCase.id, 
      data: { status: 'alerts_generated' } 
    });

    queryClient.invalidateQueries(['targeted-uids', caseId]);
    queryClient.invalidateQueries(['case-alerts', caseId]);
    queryClient.invalidateQueries(['alerts']);
    queryClient.invalidateQueries(['user-risk-scores']);
    queryClient.invalidateQueries(['predictive-spread']);
    queryClient.invalidateQueries(['crowd-alerts']);
    
    toast.success(`✅ Complete! ${uniqueUIDs.length} users matched, risk scores calculated, predictions generated, alerts sent.`);
    setIsProcessing(false);
  };

  const closeCase = async () => {
    await updateCaseMutation.mutateAsync({ 
      id: currentCase.id, 
      data: { status: 'closed' } 
    });
    toast.success('Case closed successfully');
  };

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h2 className="text-lg font-semibold text-slate-900">Case not found</h2>
        <Link to={createPageUrl('CasesList')}>
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Button>
        </Link>
      </div>
    );
  }

  const authorityAlerts = alerts.filter(a => a.alert_type === 'authority_alert');
  const userNotifications = alerts.filter(a => a.alert_type === 'user_notification');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('CasesList')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">Case Details</h1>
              <StatusBadge status={currentCase.status} />
            </div>
            <p className="text-slate-500 mt-1">ID: {currentCase.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentCase.status === 'pending_check' && (
            <Button 
              onClick={runDangerCheck}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run Danger Check
                </>
              )}
            </Button>
          )}
          {currentCase.status === 'alerts_generated' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Close Case
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close this case?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the case as closed. All alerts have been sent and logged.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={closeCase}>Close Case</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Case Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Case Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Case Type</p>
                <div className="mt-1">
                  <CaseTypeBadge caseType={currentCase.case_type} />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Severity</p>
                <div className="mt-1">
                  <SeverityBadge severity={currentCase.severity_level} />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Confirmed Case</p>
                <Badge variant={currentCase.confirmed_case ? 'default' : 'outline'} className="mt-1">
                  {currentCase.confirmed_case ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {currentCase.confirmed_case ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Abnormal Cluster</p>
                <Badge variant={currentCase.abnormal_symptom_cluster ? 'default' : 'outline'} className="mt-1">
                  {currentCase.abnormal_symptom_cluster ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                  {currentCase.abnormal_symptom_cluster ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Patient Count</p>
                <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {currentCase.patient_count || 1}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Event Time</p>
                <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {currentCase.event_time ? format(new Date(currentCase.event_time), 'PPp') : '—'}
                </p>
              </div>
            </div>
            {currentCase.notes && (
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">Notes</p>
                <p className="text-slate-700 mt-1">{currentCase.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-600" />
              Suspected Source
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Hospital ID</p>
                <p className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  {currentCase.hospital_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Source Type</p>
                <p className="font-semibold text-slate-900 mt-1 capitalize">
                  {currentCase.suspected_source_type?.replace('_', ' ') || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Source ID</p>
                <p className="font-semibold text-slate-900 mt-1">
                  {currentCase.suspected_source_id || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Source Name</p>
                <p className="font-semibold text-slate-900 mt-1">
                  {currentCase.suspected_source_name || '—'}
                </p>
              </div>
              {(currentCase.gps_lat && currentCase.gps_lng) && (
                <div className="col-span-2">
                  <p className="text-sm text-slate-500">GPS Coordinates</p>
                  <p className="font-mono text-sm text-slate-700 mt-1">
                    {currentCase.gps_lat}, {currentCase.gps_lng}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Targeted UIDs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Targeted Users ({targetedUIDs.length})
          </CardTitle>
          <CardDescription>
            Users identified as potentially exposed based on location data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {targetedUIDs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p>No targeted users yet</p>
              <p className="text-sm">Run the danger check to identify potentially exposed users</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Matched Time</TableHead>
                    <TableHead>Notification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetedUIDs.map((uid) => (
                    <TableRow key={uid.id}>
                      <TableCell className="font-mono text-sm">{uid.uid}</TableCell>
                      <TableCell>{uid.matched_location_name || uid.matched_location_id}</TableCell>
                      <TableCell>
                        {uid.matched_timestamp ? format(new Date(uid.matched_timestamp), 'PPp') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={uid.notification_sent ? 'default' : 'outline'}>
                          {uid.notification_sent ? (
                            <><CheckCircle className="w-3 h-3 mr-1" /> Sent</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" /> Pending</>
                          )}
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

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authority Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Authority Alerts ({authorityAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {authorityAlerts.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Shield className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No authority alerts generated</p>
              </div>
            ) : (
              <div className="space-y-3">
                {authorityAlerts.map((alert) => (
                  <div key={alert.id} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-purple-900">{alert.target}</span>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {alert.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-800">{alert.message}</p>
                    <p className="text-xs text-purple-500 mt-2">
                      {format(new Date(alert.created_date), 'PPp')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              User Notifications ({userNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userNotifications.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No user notifications sent</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {userNotifications.map((alert) => (
                  <div key={alert.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-blue-900">{alert.target}</span>
                      <Badge className="bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {alert.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-blue-500">
                      {format(new Date(alert.created_date), 'PPp')}
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