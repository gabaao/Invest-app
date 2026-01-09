import React from 'react';
import { GameState } from '../types';
import { SectionHeader, StatRow, formatCurrency } from './FinancialCard';
import { 
  Building2, User, PieChart, TrendingUp, AlertTriangle, 
  Crown, Warehouse, Building, Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const getOfficeTier = (valuation: number) => {
  if (valuation < 100000) return { label: 'Garagem', icon: Warehouse, color: 'text-zinc-400' };
  if (valuation < 1000000) return { label: 'Escritório Comercial', icon: Building, color: 'text-blue-400' };
  if (valuation < 10000000) return { label: 'Andar Corporativo', icon: Building2, color: 'text-purple-400' };
  return { label: 'Sede Global', icon: Crown, color: 'text-amber-500' };
};

export const NewsTicker: React.FC<{ headlines: string[] }> = ({ headlines }) => {
    if (!headlines || headlines.length === 0) return null;
    return (
        <div className="bg-zinc-900 border-b border-zinc-800 py-1 overflow-hidden relative flex items-center">
             <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
            <div className="bg-rose-900/80 text-white text-[10px] font-bold px-2 py-0.5 ml-2 rounded uppercase tracking-wider z-10 shadow-lg">
                Breaking News
            </div>
            <div className="whitespace-nowrap flex gap-8 px-4 animate-marquee">
                {[...headlines, ...headlines].map((h, i) => (
                    <span key={i} className="text-xs text-zinc-400 font-mono inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span> {h}
                    </span>
                ))}
            </div>
        </div>
    );
};

export const MacroHeader: React.FC<{ state: GameState }> = ({ state }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-zinc-900/30 border border-zinc-800">
        <div>
            <div className="text-[10px] uppercase text-zinc-500 font-bold">Mês / Turno</div>
            <div className="text-xl font-mono text-zinc-200">#{state.turn}</div>
        </div>
        <div>
            <div className="text-[10px] uppercase text-zinc-500 font-bold">Humor de Mercado</div>
            <div className={`text-sm font-bold ${state.marketMood.includes('Bull') ? 'text-emerald-400' : state.marketMood.includes('Bear') ? 'text-rose-400' : 'text-amber-400'}`}>
                {state.marketMood}
            </div>
        </div>
        <div>
            <div className="text-[10px] uppercase text-zinc-500 font-bold">Inflação</div>
            <div className="text-sm font-mono text-zinc-300">{(state.inflationRate * 100).toFixed(2)}%</div>
        </div>
        <div>
            <div className="text-[10px] uppercase text-zinc-500 font-bold">Juros (Selic)</div>
            <div className="text-sm font-mono text-zinc-300">{(state.interestRate * 100).toFixed(2)}%</div>
        </div>
    </div>
);

export const OverviewSummary: React.FC<{ state: GameState }> = ({ state }) => {
    return (
        <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 hover:border-blue-500/50 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-950/50 rounded text-blue-400 group-hover:text-blue-300"><Building2 size={20} /></div>
                    <div>
                        <div className="text-[10px] uppercase text-zinc-500 font-bold">Caixa Corporativo</div>
                        <div className="text-xl font-mono text-white">{formatCurrency(state.corporate.cash)}</div>
                    </div>
                </div>
                <div className="text-xs text-zinc-500 pl-11">
                    Lucro Líquido: <span className={(state.corporate.revenue - state.corporate.expenses) >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                        {formatCurrency(state.corporate.revenue - state.corporate.expenses)}
                    </span>
                </div>
            </div>

            <div className="bg-zinc-900/50 p-4 rounded border border-zinc-800 hover:border-emerald-500/50 transition-colors group">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-950/50 rounded text-emerald-400 group-hover:text-emerald-300"><User size={20} /></div>
                    <div>
                        <div className="text-[10px] uppercase text-zinc-500 font-bold">Patrimônio Pessoal</div>
                        <div className="text-xl font-mono text-white">{formatCurrency(state.personal.netWorth)}</div>
                    </div>
                </div>
                <div className="text-xs text-zinc-500 pl-11 flex gap-3">
                    <span>Stress: <span className={state.personal.stress > 80 ? 'text-rose-500' : 'text-zinc-300'}>{state.personal.stress}%</span></span>
                    <span>Renda Passiva: <span className="text-emerald-500">{formatCurrency(state.personal.passiveIncome)}</span></span>
                </div>
            </div>
        </div>
    );
};

export const CorporateView: React.FC<{ state: GameState }> = ({ state }) => {
    const { corporate } = state;
    const healthColor = corporate.health === 'Solvente' ? 'text-emerald-500' : corporate.health === 'Falência' ? 'text-rose-600' : 'text-amber-500';
    const Office = getOfficeTier(corporate.valuation);

    let nextTierVal = 0;
    let prevTierVal = 0;
    
    if (corporate.valuation < 100000) {
        nextTierVal = 100000;
        prevTierVal = 0;
    } else if (corporate.valuation < 1000000) {
        nextTierVal = 1000000;
        prevTierVal = 100000;
    } else if (corporate.valuation < 10000000) {
        nextTierVal = 10000000;
        prevTierVal = 1000000;
    } else {
        nextTierVal = 0; 
    }

    const progressPercent = nextTierVal > 0 
        ? Math.min(100, Math.max(0, ((corporate.valuation - prevTierVal) / (nextTierVal - prevTierVal)) * 100))
        : 100;
    
    const barColorClass = Office.color.replace('text-', 'bg-');

    // Chart Data Preparation (Last 3-4 months)
    const historyData = corporate.history ? corporate.history.slice(-4) : [];
    const hasHistory = historyData.length > 0;

    return (
        <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
            <SectionHeader title={`Administração Corporativa - ${state.companyName}`} icon={<Building2 size={18} />} color="text-blue-400" />
            
            <div className="mb-6 bg-zinc-900/50 p-4 rounded border border-zinc-800">
                 <div className="flex items-center gap-4 mb-4">
                     <div className={`p-3 rounded-full bg-zinc-950 border border-zinc-800 ${Office.color} shadow-lg shadow-black/50`}>
                        <Office.icon size={24} />
                     </div>
                     <div>
                        <div className="text-xs uppercase text-zinc-500 font-bold mb-0.5">Instalações Atuais</div>
                        <div className={`text-sm font-bold ${Office.color}`}>{Office.label}</div>
                     </div>
                 </div>

                 {nextTierVal > 0 ? (
                    <div className="space-y-1.5 bg-zinc-950/50 p-3 rounded border border-zinc-800/50">
                        <div className="flex justify-between text-[10px] uppercase font-mono text-zinc-500 font-bold">
                            <span>Progresso para Expansão</span>
                            <span>{Math.floor(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                            <div 
                                className={`h-full ${barColorClass} transition-all duration-1000 ease-out`} 
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-zinc-600">Atual: {formatCurrency(corporate.valuation)}</span>
                            <span className="text-zinc-400">Meta: {formatCurrency(nextTierVal)}</span>
                        </div>
                    </div>
                 ) : (
                    <div className="text-xs text-amber-500 font-mono flex items-center gap-2 bg-amber-950/20 p-2 rounded border border-amber-900/30">
                        <Crown size={14} /> 
                        <span>Domínio Global Atingido (Nível Máximo)</span>
                    </div>
                 )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Evolução do Fluxo de Caixa (Últimos Meses)</h3>
                    {hasHistory ? (
                        <div className="h-[200px] w-full bg-zinc-900/30 p-2 rounded border border-zinc-800">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                                    <XAxis dataKey="month" tick={{fill: '#71717a', fontSize: 10}} tickFormatter={(val) => `Mês ${val}`} />
                                    <YAxis tick={{fill: '#71717a', fontSize: 10}} tickFormatter={(val) => `K${(val/1000).toFixed(0)}`} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f4f4f5', fontSize: '12px' }}
                                        formatter={(value: number) => formatCurrency(value)}
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    />
                                    <ReferenceLine y={0} stroke="#52525b" />
                                    <Bar dataKey="revenue" name="Receita" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="expenses" name="Despesas" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                                    <Bar dataKey="profit" name="Lucro Líq." fill="#10b981" radius={[2, 2, 0, 0]} />
                                </BarChart>
                             </ResponsiveContainer>
                             <div className="flex justify-center gap-4 mt-2 text-[10px] uppercase font-bold text-zinc-500">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-sm"></div> Receita</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-sm"></div> Despesa</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm"></div> Lucro</div>
                             </div>
                        </div>
                    ) : (
                        <div className="h-[200px] flex items-center justify-center text-zinc-600 text-xs italic border border-zinc-800 border-dashed rounded bg-zinc-900/20">
                            Dados insuficientes para gráfico histórico
                        </div>
                    )}
                    
                    {/* Keep Cash displayed separately as it is stock, not flow */}
                    <div className="mt-4 pt-4 border-t border-zinc-800">
                        <StatRow label="Caixa em Mãos (Atual)" value={corporate.cash} />
                    </div>
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
            <SectionHeader title={`Finanças Pessoais - ${state.playerName}`} icon={<User size={18} />} color="text-emerald-400" />
            
            <div className="grid md:grid-cols-2 gap-8 mt-6">
                <div className="space-y-1">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Orçamento Doméstico</h3>
                    <StatRow label="Salário / Pró-Labore" value={personal.cash - personal.surplus} subtext="(Estimado)" />
                    <StatRow label="Renda Passiva" value={personal.passiveIncome} />
                    <StatRow label="Custo de Vida" value={personal.lifestyleCost} isNegative={true} prefix="-" />
                    <div className="my-2 border-t border-zinc-800"></div>
                    <StatRow label="Excedente Mensal" value={personal.surplus} />
                </div>

                <div className="space-y-4">
                     <div>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Saúde Mental</h3>
                        <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-800" />
                                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                        className={personal.stress > 80 ? 'text-rose-500' : personal.stress > 50 ? 'text-amber-500' : 'text-emerald-500'}
                                        strokeDasharray={125.6}
                                        strokeDashoffset={125.6 - (125.6 * personal.stress) / 100}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                    {personal.stress}
                                </div>
                            </div>
                            <div className="text-sm text-zinc-400">
                                <p className={personal.stress > 80 ? 'text-rose-400 font-bold' : ''}>
                                    {personal.stress > 80 ? 'PERIGO DE BURNOUT' : personal.stress > 50 ? 'Nível de Stress Elevado' : 'Saúde Mental Estável'}
                                </p>
                                <p className="text-xs text-zinc-600">Impacta tomada de decisão</p>
                            </div>
                        </div>
                     </div>

                     <div>
                        <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Patrimônio Líquido</h3>
                        <div className="text-2xl font-mono text-emerald-400">{formatCurrency(personal.netWorth)}</div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export const PortfolioView: React.FC<{ state: GameState }> = ({ state }) => {
    return (
        <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
             <SectionHeader title="Portfólio de Investimentos" icon={<PieChart size={18} />} color="text-purple-400" />

             {state.personal.investments.length === 0 ? (
                 <div className="text-center py-12 text-zinc-600">
                    <PieChart size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Você ainda não possui investimentos.</p>
                 </div>
             ) : (
                 <div className="overflow-x-auto mt-6">
                     <table className="w-full text-sm text-left">
                         <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
                             <tr>
                                 <th className="px-4 py-3">Ativo</th>
                                 <th className="px-4 py-3">Tipo</th>
                                 <th className="px-4 py-3 text-right">Valor Total</th>
                                 <th className="px-4 py-3 text-right">Retorno Mensal</th>
                                 <th className="px-4 py-3 text-right">Rentabilidade</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-800">
                             {state.personal.investments.map((inv, idx) => (
                                 <tr key={idx} className="hover:bg-zinc-900/30">
                                     <td className="px-4 py-3 font-medium text-zinc-300">{inv.name}</td>
                                     <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold 
                                            ${inv.type === 'Cripto' ? 'bg-indigo-900/30 text-indigo-400' : 
                                              inv.type === 'Ações' ? 'bg-blue-900/30 text-blue-400' :
                                              inv.type === 'FIIs' ? 'bg-purple-900/30 text-purple-400' :
                                              'bg-emerald-900/30 text-emerald-400'}`}>
                                            {inv.type}
                                        </span>
                                     </td>
                                     <td className="px-4 py-3 text-right font-mono text-zinc-300">{formatCurrency(inv.amount)}</td>
                                     <td className="px-4 py-3 text-right font-mono text-emerald-400">+{formatCurrency(inv.monthlyYield)}</td>
                                     <td className="px-4 py-3 text-right font-mono text-zinc-500">{(inv.yieldRate * 100).toFixed(2)}%</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             )}
        </div>
    );
};