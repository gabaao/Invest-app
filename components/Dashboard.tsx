import React from 'react';
import { GameState, Investment } from '../types';
import { StatRow, SectionHeader, formatCurrency } from './FinancialCard';
import { Building2, User, TrendingUp, PieChart, ArrowUpRight, ArrowDownRight, Activity, Wallet, Briefcase } from 'lucide-react';

// --- SUB-COMPONENTS ---

export const MacroHeader: React.FC<{ state: GameState }> = ({ state }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-950 p-4 rounded-lg border border-zinc-800 mb-6">
    <div>
        <span className="text-xs text-zinc-500 uppercase block">Humor</span>
        <span className="text-sm font-bold text-zinc-200">{state.marketMood}</span>
    </div>
    <div>
        <span className="text-xs text-zinc-500 uppercase block">Inflação</span>
        <span className="text-sm font-mono text-rose-400">{state.inflationRate}%</span>
    </div>
    <div>
        <span className="text-xs text-zinc-500 uppercase block">Selic</span>
        <span className="text-sm font-mono text-amber-400">{state.interestRate}%</span>
    </div>
    <div className="text-right">
         <span className="text-xs text-zinc-500 uppercase block">Calendário</span>
         <span className="text-sm font-bold text-emerald-500">Mês {state.turn}</span>
    </div>
  </div>
);

const InvestmentItem: React.FC<{ inv: Investment }> = ({ inv }) => {
  const isPositive = inv.monthlyYield >= 0;
  return (
    <div className="flex justify-between items-center py-3 border-b border-zinc-800 last:border-0 text-sm hover:bg-zinc-900/50 px-2 rounded transition-colors">
       <div>
           <div className="font-bold text-zinc-200">{inv.name}</div>
           <div className="text-xs text-zinc-500 uppercase tracking-wider">{inv.type}</div>
       </div>
       <div className="text-right">
           <div className="font-mono text-zinc-300">{formatCurrency(inv.amount)}</div>
           <div className={`font-mono text-xs flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {formatCurrency(inv.monthlyYield)} ({inv.yieldRate > 0 ? '+' : ''}{inv.yieldRate}%)
           </div>
       </div>
    </div>
  );
};

// --- TAB VIEWS ---

export const OverviewSummary: React.FC<{ state: GameState }> = ({ state }) => {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900/40 p-4 rounded border border-zinc-800">
                <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold text-xs uppercase">
                    <Building2 size={14} /> Resumo PJ
                </div>
                <div className="text-xl font-mono text-white mb-1">{formatCurrency(state.corporate.cash)}</div>
                <div className={`text-xs font-bold uppercase ${state.corporate.health === 'Solvente' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {state.corporate.health}
                </div>
            </div>
            <div className="bg-zinc-900/40 p-4 rounded border border-zinc-800">
                <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold text-xs uppercase">
                    <User size={14} /> Resumo PF
                </div>
                <div className="text-xl font-mono text-white mb-1">{formatCurrency(state.personal.cash)}</div>
                <div className="text-xs text-zinc-500">Líquido Disponível</div>
            </div>
        </div>
    );
};

export const CorporateView: React.FC<{ state: GameState }> = ({ state }) => {
    const { corporate } = state;
    const healthColor = corporate.health === 'Solvente' ? 'text-emerald-500' : corporate.health === 'Falência' ? 'text-rose-600' : 'text-amber-500';

    return (
        <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
            <SectionHeader title={`Administração Corporativa - ${state.companyName}`} icon={<Building2 size={18} />} color="text-blue-400" />
            
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Fluxo de Caixa</h3>
                    <StatRow label="Caixa em Mãos" value={corporate.cash} />
                    <StatRow label="Receita Recorrente" value={corporate.revenue} />
                    <StatRow label="Custos Operacionais" value={corporate.expenses} isNegative={true} prefix="-" />
                    <StatRow label="Pagamento de Dívidas" value={corporate.debtService} isNegative={true} prefix="-" />
                    <div className="my-2 border-t border-zinc-800"></div>
                    <StatRow label="Resultado Líquido" value={corporate.revenue - corporate.expenses - corporate.debtService} 
                            isNegative={(corporate.revenue - corporate.expenses - corporate.debtService) < 0} />
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Balanço & Métricas</h3>
                    <StatRow label="Valuation da Empresa" value={corporate.valuation} />
                    <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                        <span className="text-zinc-400 text-sm">Status da Empresa</span>
                        <span className={`font-bold uppercase text-sm ${healthColor}`}>{corporate.health}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PersonalView: React.FC<{ state: GameState }> = ({ state }) => {
    const { personal } = state;
    return (
        <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-600"></div>
            <SectionHeader title={`Administração Pessoal - ${state.playerName}`} icon={<User size={18} />} color="text-emerald-400" />
            
            <div className="space-y-1">
                <StatRow label="Patrimônio Líquido Total" value={personal.netWorth} />
                <div className="my-4 border-t border-zinc-800"></div>
                <StatRow label="Dinheiro em Conta (Líquido)" value={personal.cash} />
                <StatRow label="Total em Investimentos" value={personal.portfolio} />
                <div className="my-4 border-t border-zinc-800"></div>
                <StatRow label="Renda Passiva (Investimentos)" value={personal.passiveIncome} />
                <StatRow label="Custo de Vida / Estilo" value={personal.lifestyleCost} isNegative={true} prefix="-" />
                <div className="my-2 border-t border-zinc-800"></div>
                <StatRow label="Excedente Mensal (Free Cash)" value={personal.surplus} isNegative={personal.surplus < 0} />
            </div>
        </div>
    );
};

export const PortfolioView: React.FC<{ state: GameState }> = ({ state }) => {
    const { personal } = state;
    
    // Group investments by type for the chart/summary logic if we wanted, 
    // for now we just list them nicely.
    
    return (
        <div className="space-y-6">
            <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <SectionHeader title="Resumo do Portfólio" icon={<PieChart size={18} />} color="text-amber-400" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-zinc-900/50 p-4 rounded text-center">
                        <span className="text-xs text-zinc-500 uppercase">Valor Total</span>
                        <div className="text-2xl font-mono text-white">{formatCurrency(personal.portfolio)}</div>
                     </div>
                     <div className="bg-zinc-900/50 p-4 rounded text-center">
                        <span className="text-xs text-zinc-500 uppercase">Rendimento Mensal</span>
                        <div className="text-2xl font-mono text-emerald-400">+{formatCurrency(personal.passiveIncome)}</div>
                     </div>
                </div>
            </div>

            <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800">
                <SectionHeader title="Alocação de Ativos" icon={<Activity size={18} />} color="text-zinc-400" />
                
                {personal.investments && personal.investments.length > 0 ? (
                    <div className="divide-y divide-zinc-800/50">
                        {personal.investments.map((inv, idx) => (
                            <InvestmentItem key={idx} inv={inv} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-zinc-500">
                        <Wallet size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Você ainda não possui investimentos.</p>
                        <p className="text-xs">Use o excedente mensal na aba "Visão Geral" para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Default export if needed, though we primarily use named exports now
const DashboardDefault = () => <div>Use named exports</div>;
export default DashboardDefault;
