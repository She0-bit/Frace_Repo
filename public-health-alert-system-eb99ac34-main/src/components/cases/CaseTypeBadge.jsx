import React from 'react';
import { cn } from '@/lib/utils';
import { Flame, Utensils, Wind, Droplets, HelpCircle } from 'lucide-react';

const caseTypeConfig = {
  heat_stroke: {
    label: 'Heat Stroke',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: Flame
  },
  food_poisoning: {
    label: 'Food Poisoning',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Utensils
  },
  respiratory_illness: {
    label: 'Respiratory Illness',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Wind
  },
  waterborne_disease: {
    label: 'Waterborne Disease',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    icon: Droplets
  },
  other: {
    label: 'Other',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: HelpCircle
  }
};

export default function CaseTypeBadge({ caseType }) {
  const config = caseTypeConfig[caseType] || caseTypeConfig.other;
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border",
      config.color
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}