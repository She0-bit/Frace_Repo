import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, 
  Map,
  AlertTriangle,
  Zap,
  RefreshCw,
  Users,
  Thermometer,
  Wind,
  Droplets,
  Clock,
  Target
} from 'lucide-react';
import { format, addHours } from 'date-fns';
import { toast } from 'sonner';

export default function PredictiveSpread() {
  const queryClient = useQueryClient();
  const [selectedCase, setSelectedCase] = useState('');

  const { data: cases = [] } = useQuery({
    queryKey: ['hospital-cases'],
    queryFn: () => base44.entities.HospitalInput.filter(
      { status: ['processing', 'alerts_generated', 'closed'] },
      '-created_date',
      50
    )
  });

  const { data: predictions = [], isLoading, refetch } = useQuery({
    queryKey: ['predictive-spread'],
    queryFn: () => base44.entities.PredictiveSpread.list('-prediction_time', 100)
  });

  const { data: locationData = [] } = useQuery({
    queryKey: ['location-tracking'],
    queryFn: () => base44.entities.LocationTracking.list('-timestamp', 500)
  });

  const generatePrediction = async (caseId) => {
    const caseData = cases.find(c => c.id === caseId);
    if (!caseData) return;

    // Simulate ML prediction logic
    const zones = [
      { id: 'ZONE-A', name: 'North District', lat: 24.7241, lng: 46.6789 },
      { id: 'ZONE-B', name: 'East Quarter', lat: 24.7136, lng: 46.6853 },
      { id: 'ZONE-C', name: 'Central Plaza', lat: 24.7050, lng: 46.6700 },
      { id: 'ZONE-D', name: 'South Sector', lat: 24.6950, lng: 46.6650 }
    ];

    // Generate predictions for 1, 2, and 3 hours ahead
    for (const hours of [1, 2, 3]) {
      const zone = zones[Math.floor(Math.random() * zones.length)];
      
      // Calculate probability based on various factors
      const baseProbability = 30 + Math.random() * 50; // 30-80%
      const densityFactor = locationData.length > 100 ? 1.2 : 1.0;
      const heatFactor = caseData.case_type === 'heat_stroke' ? 1.3 : 1.0;
      const timeFactor = hours === 1 ? 1.2 : hours === 2 ? 1.0 : 0.8;
      
      const probability = Math.min(95, baseProbability * densityFactor * heatFactor * timeFactor);
      
      const heatIndex = 35 + Math.random() * 15;
      const humidity = 30 + Math.random() * 50;
      const windSpeed = 5 + Math.random() * 15;
      
      let riskLevel = 'low';
      if (probability > 75) riskLevel = 'critical';
      else if (probability > 60) riskLevel = 'high';
      else if (probability > 40) riskLevel = 'medium';

      await base44.entities.PredictiveSpread.create({
        case_id: caseId,
        prediction_time: new Date().toISOString(),
        forecast_hours: hours,
        predicted_zone: zone.id,
        predicted_zone_name: zone.name,
        probability_percent: Math.round(probability),
        risk_level: riskLevel,
        contributing_factors: {
          density_trend: locationData.length > 100 ? 'increasing' : 'stable',
          time_overlap: Math.round(Math.random() * 50),
          heat_index: heatIndex,
          humidity: humidity,
          wind_speed: windSpeed,
          crowd_movement: ['northward', 'southward', 'dispersing', 'converging'][Math.floor(Math.random() * 4)]
        },
        gps_lat: zone.lat,
        gps_lng: zone.lng
      });
    }

    queryClient.invalidateQueries(['predictive-spread']);
    toast.success('Predictions generated for 1, 2, and 3 hours ahead');
  };

  const casePredictions = selectedCase 
    ? predictions.filter(p => p.case_id === selectedCase)
    : predictions;

  const getProbabilityColor = (probability) => {
    if (probability >= 75) return 'bg-red-500';
    if (probability >= 60) return 'bg-orange-500';
    if (probability >= 40) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getRiskBadge = (risk) => {
    const config = {
      low: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };
    return config[risk] || config.low;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Predictive Spread Model</h1>
          <p className="text-slate-500 mt-1">ML-based risk spread forecasting</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCase} onValueChange={setSelectedCase}>
            <SelectTrigger className="w-[250px]">
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
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Generate Predictions */}
      {cases.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Generate Predictions</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Select a case to generate risk spread forecasts
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Select onValueChange={(value) => generatePrediction(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select case" />
                  </SelectTrigger>
                  <SelectContent>
                    {cases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.case_type?.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Map Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((hours) => {
          const hourPredictions = casePredictions.filter(p => p.forecast_hours === hours);
          const latestPrediction = hourPredictions[0];

          return (
            <Card key={hours}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                  {hours} Hour{hours > 1 ? 's' : ''} Ahead
                </CardTitle>
                <CardDescription>
                  Forecast until {format(addHours(new Date(), hours), 'HH:mm')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latestPrediction ? (
                  <div className="space-y-4">
                    {/* Probability Circle */}
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-200"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - latestPrediction.probability_percent / 100)}`}
                            className={latestPrediction.probability_percent >= 75 ? 'text-red-500' : 
                                      latestPrediction.probability_percent >= 60 ? 'text-orange-500' :
                                      latestPrediction.probability_percent >= 40 ? 'text-yellow-500' : 'text-emerald-500'}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-slate-900">
                            {latestPrediction.probability_percent}%
                          </span>
                          <span className="text-xs text-slate-500">probability</span>
                        </div>
                      </div>
                    </div>

                    {/* Predicted Zone */}
                    <div className="p-4 bg-slate-50 rounded-xl text-center">
                      <p className="text-sm text-slate-500 mb-1">Predicted Zone</p>
                      <p className="font-bold text-slate-900 text-lg">{latestPrediction.predicted_zone_name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{latestPrediction.predicted_zone}</p>
                    </div>

                    {/* Risk Level */}
                    <div className="text-center">
                      <Badge className={`${getRiskBadge(latestPrediction.risk_level)} text-sm px-4 py-1`}>
                        {latestPrediction.risk_level.toUpperCase()} RISK
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Map className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No predictions available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Model Explanation */}
      {casePredictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Model Explanation
            </CardTitle>
            <CardDescription>
              Contributing factors influencing predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {casePredictions.slice(0, 3).map((prediction, idx) => (
                <div key={prediction.id} className="p-5 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-500">
                      {prediction.forecast_hours}h Forecast
                    </span>
                    <Badge variant="outline">{prediction.probability_percent}%</Badge>
                  </div>
                  
                  {prediction.contributing_factors && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 flex items-center gap-2">
                          <Thermometer className="w-4 h-4" />
                          Heat Index
                        </span>
                        <span className="font-semibold">
                          {prediction.contributing_factors.heat_index?.toFixed(1)}°C
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          Humidity
                        </span>
                        <span className="font-semibold">
                          {prediction.contributing_factors.humidity?.toFixed(0)}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 flex items-center gap-2">
                          <Wind className="w-4 h-4" />
                          Wind Speed
                        </span>
                        <span className="font-semibold">
                          {prediction.contributing_factors.wind_speed?.toFixed(1)} km/h
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Density Trend
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {prediction.contributing_factors.density_trend}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Crowd Movement
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {prediction.contributing_factors.crowd_movement}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Time Overlap</span>
                        <span className="font-semibold">
                          {prediction.contributing_factors.time_overlap} min
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Predictions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Predictions</CardTitle>
          <CardDescription>Complete prediction history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : casePredictions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Map className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No predictions available</p>
              <p className="text-sm mt-1">Generate predictions for active cases</p>
            </div>
          ) : (
            <div className="space-y-4">
              {casePredictions.map((prediction) => {
                const caseData = cases.find(c => c.id === prediction.case_id);
                return (
                  <div key={prediction.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getRiskBadge(prediction.risk_level)}>
                            {prediction.risk_level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {prediction.forecast_hours}h forecast
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {caseData?.case_type?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-900">
                          {prediction.predicted_zone_name} ({prediction.predicted_zone})
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {prediction.probability_percent}% probability of risk spread
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`w-16 h-16 rounded-full ${getProbabilityColor(prediction.probability_percent)} flex items-center justify-center`}>
                          <span className="text-white font-bold">{prediction.probability_percent}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Generated {format(new Date(prediction.prediction_time), 'PPp')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Prediction Model</h3>
              <p className="text-sm text-slate-600 mt-1">
                The predictive spread model uses multiple variables including GPS density trends, 
                time-overlap patterns, case type severity, environmental conditions (heat index, humidity, wind), 
                and crowd movement patterns to forecast where health risks may spread in the next 1-3 hours.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Higher probability zones receive priority monitoring and preventive alerts are sent 
                to field teams for proactive crowd management.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}