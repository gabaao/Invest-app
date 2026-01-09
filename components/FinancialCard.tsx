import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle, Wallet, Building2, User } from 'lucide-react';

interface StatRowProps {
  label: string;
  value: number;
  isNegative?: boolean;
  prefix?: string;
  subtext?: string;
}

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val);
};

export const StatRow: React.FC<StatRowProps> = ({ label, value, isNegative, prefix = '', subtext }) => {
  const colorClass = isNegative ? 'text-rose-500' : 'text-emerald-400';
  const displayValue = prefix + formatCurrency(value);

  return (
    <div className="flex justify-between items-center py-2 border-b border-zinc-800 last:border-0">
      <span className="text-zinc-400 text-sm">{label}</span>
      <div className="text-right">
        <span className={`font-mono font-medium ${isNegative === undefined ? 'text-zinc-200' : colorClass}`}>
          {displayValue}
        </span>
        {subtext && <div className="text-xs text-zinc-500">{subtext}</div>}
      </div>
    </div>
  );
};

export const SectionHeader: React.FC<{ title: string; icon: React.ReactNode; color?: string }> = ({ title, icon, color = "text-zinc-100" }) => (
  <div className={`flex items-center gap-2 mb-4 uppercase tracking-wider text-xs font-bold ${color}`}>
    {icon}
    {title}
  </div>
);