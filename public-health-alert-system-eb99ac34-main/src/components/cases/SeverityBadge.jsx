import React from 'react';
import { cn } from '@/lib/utils';

const severityConfig = {
  low: {
    label: 'Low',
    color: 'bg-green-100 text-green-700'
  },
  medium: {
    label: 'Medium',
    color: 'bg-yellow-100 text-yellow-700'
  },
  high: {
    label: 'High',
    color: 'bg-orange-100 text-orange-700'
  },
  critical: {
    label: 'Critical',
    color: 'bg-red-100 text-red-700'
  }
};

export default function SeverityBadge({ severity }) {
  const config = severityConfig[severity] || severityConfig.low;

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide",
      config.color
    )}>
      {config.label}
    </span>
  );
}