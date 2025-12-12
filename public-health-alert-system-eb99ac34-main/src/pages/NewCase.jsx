import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  AlertTriangle, 
  Building2, 
  MapPin,
  Calendar,
  Users,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function NewCase() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    hospital_id: 'HOSP-001',
    case_type: '',
    confirmed_case: false,
    abnormal_symptom_cluster: false,
    severity_level: 'low',
    suspected_source_type: '',
    suspected_source_id: '',
    suspected_source_name: '',
    event_time: '',
    patient_count: 1,
    notes: '',
    gps_lat: null,
    gps_lng: null,
    status: 'pending_check'
  });

  const createCaseMutation = useMutation({
    mutationFn: (data) => base44.entities.HospitalInput.create(data),
    onSuccess: (newCase) => {
      queryClient.invalidateQueries(['hospital-cases']);
      toast.success('Case reported successfully');
      navigate(createPageUrl('CaseDetails') + `?id=${newCase.id}`);
    },
    onError: (error) => {
      toast.error('Failed to create case: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createCaseMutation.mutate(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Report New Case</h1>
        <p className="text-slate-500 mt-1">Enter details about the medical incident</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Hospital Information */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Hospital Information</CardTitle>
                <CardDescription>Reporting facility details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hospital_id">Hospital ID</Label>
              <Input
                id="hospital_id"
                value={formData.hospital_id}
                onChange={(e) => updateField('hospital_id', e.target.value)}
                placeholder="Enter hospital ID"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Case Details */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Case Details</CardTitle>
                <CardDescription>Medical incident information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="case_type">Case Type *</Label>
                <Select
                  value={formData.case_type}
                  onValueChange={(value) => updateField('case_type', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select case type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heat_stroke">Heat Stroke</SelectItem>
                    <SelectItem value="food_poisoning">Food Poisoning</SelectItem>
                    <SelectItem value="respiratory_illness">Respiratory Illness</SelectItem>
                    <SelectItem value="waterborne_disease">Waterborne Disease</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="severity_level">Severity Level *</Label>
                <Select
                  value={formData.severity_level}
                  onValueChange={(value) => updateField('severity_level', value)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label htmlFor="confirmed_case" className="text-sm font-medium">Confirmed Case</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Has the case been confirmed?</p>
                </div>
                <Switch
                  id="confirmed_case"
                  checked={formData.confirmed_case}
                  onCheckedChange={(checked) => updateField('confirmed_case', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label htmlFor="abnormal_cluster" className="text-sm font-medium">Abnormal Symptom Cluster</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Multiple related cases?</p>
                </div>
                <Switch
                  id="abnormal_cluster"
                  checked={formData.abnormal_symptom_cluster}
                  onCheckedChange={(checked) => updateField('abnormal_symptom_cluster', checked)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="event_time">Event Time *</Label>
                <Input
                  id="event_time"
                  type="datetime-local"
                  value={formData.event_time}
                  onChange={(e) => updateField('event_time', e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="patient_count">Number of Patients</Label>
                <Input
                  id="patient_count"
                  type="number"
                  min="1"
                  value={formData.patient_count}
                  onChange={(e) => updateField('patient_count', parseInt(e.target.value) || 1)}
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suspected Source */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Suspected Source</CardTitle>
                <CardDescription>Location information for contact tracing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="suspected_source_type">Source Type</Label>
              <Select
                value={formData.suspected_source_type}
                onValueChange={(value) => updateField('suspected_source_type', value)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="outdoor_event">Outdoor Event</SelectItem>
                  <SelectItem value="public_venue">Public Venue</SelectItem>
                  <SelectItem value="workplace">Workplace</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="suspected_source_id">Source ID / Code</Label>
                <Input
                  id="suspected_source_id"
                  value={formData.suspected_source_id}
                  onChange={(e) => updateField('suspected_source_id', e.target.value)}
                  placeholder="e.g., REST-001"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="suspected_source_name">Source Name</Label>
                <Input
                  id="suspected_source_name"
                  value={formData.suspected_source_name}
                  onChange={(e) => updateField('suspected_source_name', e.target.value)}
                  placeholder="e.g., Downtown Restaurant"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="gps_lat">GPS Latitude</Label>
                <Input
                  id="gps_lat"
                  type="number"
                  step="any"
                  value={formData.gps_lat || ''}
                  onChange={(e) => updateField('gps_lat', parseFloat(e.target.value) || null)}
                  placeholder="e.g., 24.7136"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="gps_lng">GPS Longitude</Label>
                <Input
                  id="gps_lng"
                  type="number"
                  step="any"
                  value={formData.gps_lng || ''}
                  onChange={(e) => updateField('gps_lng', parseFloat(e.target.value) || null)}
                  placeholder="e.g., 46.6753"
                  className="mt-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Additional Notes</CardTitle>
                <CardDescription>Any other relevant information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Enter any additional details about the case..."
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate(createPageUrl('CasesList'))}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
            disabled={createCaseMutation.isPending || !formData.case_type || !formData.event_time}
          >
            {createCaseMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Case
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}