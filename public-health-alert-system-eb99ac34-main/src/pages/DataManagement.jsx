import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Shield, 
  Trash2,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Settings,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';

export default function DataManagement() {
  const queryClient = useQueryClient();
  const [retentionDays, setRetentionDays] = useState(14);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: targetedUIDs = [], isLoading } = useQuery({
    queryKey: ['all-targeted-uids'],
    queryFn: () => base44.entities.TargetedUID.list('-created_date', 500)
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['hospital-cases'],
    queryFn: () => base44.entities.HospitalInput.list('-created_date', 100)
  });

  const cutoffDate = subDays(new Date(), retentionDays);
  const recordsToDelete = targetedUIDs.filter(uid => 
    new Date(uid.created_date) < cutoffDate
  );

  const applyDeletionPolicy = async () => {
    if (recordsToDelete.length === 0) {
      toast.info('No records to delete based on current retention policy');
      return;
    }

    setIsDeleting(true);
    let deleted = 0;

    for (const record of recordsToDelete) {
      await base44.entities.TargetedUID.delete(record.id);
      deleted++;
    }

    queryClient.invalidateQueries(['all-targeted-uids']);
    queryClient.invalidateQueries(['targeted-uids']);
    toast.success(`Deleted ${deleted} records older than ${retentionDays} days`);
    setIsDeleting(false);
  };

  const deleteAllTargetedUIDs = async () => {
    setIsDeleting(true);
    let deleted = 0;

    for (const record of targetedUIDs) {
      await base44.entities.TargetedUID.delete(record.id);
      deleted++;
    }

    queryClient.invalidateQueries(['all-targeted-uids']);
    queryClient.invalidateQueries(['targeted-uids']);
    toast.success(`Deleted all ${deleted} targeted UID records`);
    setIsDeleting(false);
  };

  // Group by case
  const caseGroups = targetedUIDs.reduce((acc, uid) => {
    const key = uid.case_id;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(uid);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Data Management</h1>
        <p className="text-slate-500 mt-1">Privacy controls and data minimization</p>
      </div>

      {/* Privacy Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Data Minimization Policy</h3>
              <p className="text-sm text-blue-800 mt-1">
                The TargetedUIDs table is temporary and should only contain data necessary for immediate 
                alert processing. Regular cleanup ensures compliance with data protection principles.
              </p>
              <ul className="mt-3 space-y-1 text-sm text-blue-700">
                <li>• TargetedUIDs are generated during danger check processing</li>
                <li>• Records should be deleted after the retention period</li>
                <li>• Default retention: 14 days (configurable)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total TargetedUIDs</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{targetedUIDs.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Linked Cases</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">{Object.keys(caseGroups).length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Notifications Sent</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {targetedUIDs.filter(u => u.notification_sent).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={recordsToDelete.length > 0 ? 'bg-amber-50 border-amber-200' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Eligible for Deletion</p>
                <p className={`text-3xl font-bold mt-1 ${recordsToDelete.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                  {recordsToDelete.length}
                </p>
              </div>
              <div className={`w-12 h-12 ${recordsToDelete.length > 0 ? 'bg-amber-100' : 'bg-slate-100'} rounded-xl flex items-center justify-center`}>
                <Trash2 className={`w-6 h-6 ${recordsToDelete.length > 0 ? 'text-amber-600' : 'text-slate-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deletion Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            Retention Policy Settings
          </CardTitle>
          <CardDescription>
            Configure how long TargetedUID records are retained before deletion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 max-w-xs">
              <Label htmlFor="retentionDays">Retention Period (Days)</Label>
              <Input
                id="retentionDays"
                type="number"
                min="1"
                max="365"
                value={retentionDays}
                onChange={(e) => setRetentionDays(parseInt(e.target.value) || 14)}
                className="mt-1.5"
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  disabled={recordsToDelete.length === 0 || isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  Apply Deletion Policy
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apply Deletion Policy?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {recordsToDelete.length} TargetedUID record(s) 
                    older than {retentionDays} days. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={applyDeletionPolicy} className="bg-amber-600 hover:bg-amber-700">
                    Delete Records
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>Records created before <strong>{format(cutoffDate, 'PPP')}</strong> will be deleted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect all data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
            <div>
              <p className="font-medium text-red-900">Delete All TargetedUID Records</p>
              <p className="text-sm text-red-700 mt-1">
                This will permanently delete all {targetedUIDs.length} records in the TargetedUIDs table.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="gap-2"
                  disabled={targetedUIDs.length === 0 || isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All TargetedUID Records?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL {targetedUIDs.length} TargetedUID records. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAllTargetedUIDs} className="bg-red-600 hover:bg-red-700">
                    Delete All Records
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Records by Case */}
      <Card>
        <CardHeader>
          <CardTitle>TargetedUIDs by Case</CardTitle>
          <CardDescription>
            Breakdown of targeted users per case
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : Object.keys(caseGroups).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No TargetedUID records</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(caseGroups).map(([caseId, uids]) => {
                const caseInfo = cases.find(c => c.id === caseId);
                return (
                  <div key={caseId} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-900">
                          {caseInfo?.case_type?.replace('_', ' ') || 'Unknown Case'}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">{caseId.slice(0, 20)}...</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">{uids.length}</p>
                        <p className="text-xs text-slate-500">users</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{uids.filter(u => u.notification_sent).length} notified</span>
                      <span>•</span>
                      <span>
                        Created {caseInfo?.created_date 
                          ? format(new Date(caseInfo.created_date), 'MMM d, yyyy')
                          : 'Unknown'
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}