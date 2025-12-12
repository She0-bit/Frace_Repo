import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

const statusConfig = {
  pending_check: {
    label: 'Pending Check',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock
  },
  no_alert_needed: {
    label: 'No Alert Needed',
    color: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: XCircle
  },
  processing: {
    label: 'Processing',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Loader2
  },
  alerts_generated: {
    label: 'Alerts Generated',
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: AlertTriangle
  },
  closed: {
    label: 'Closed',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle
  }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pending_check;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
      config.color
    )}>
      <Icon className={cn("w-3.5 h-3.5", status === 'processing' && "animate-spin")} />
      {config.label}
    </span>
  );
}