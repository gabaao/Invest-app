import React, { useState, useEffect, useRef } from 'react';
import { Archetype, GamePhase, GameState, SetupResponse, TurnResponse } from './types';
import * as GeminiService from './services/geminiService';
import { 
  MacroHeader, 
  OverviewSummary, 
  CorporateView, 
  PersonalView, 
  PortfolioView 
} from './components/Dashboard';
import { 
  Play, TrendingUp, Skull, Shield, Zap, Terminal, Loader2, ArrowRight, 
  LayoutDashboard, Building2, User, PieChart, Menu
} from 'lucide-react';
import { formatCurrency } from './components/FinancialCard';

type Tab = 'overview' | 'corporate' | 'personal' | 'portfolio';

const App: React.FC = () => {
  // --- STATE ---
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Setup Data
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Game Data
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // Input Data
  const [surplusAllocation, setSurplusAllocation] = useState<string>('Reinvestir na Empresa');
  const [customAllocation, setCustomAllocation] = useState<string>('');

  // Refs for scrolling
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- HANDLERS ---

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const data = await GeminiService.fetchSetup();
        setSetupData(data);
      } catch (err) {
        setError("Falha ao conectar ao Mestre do Jogo (Gemini). Verifique sua chave de API.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleStartGame = async () => {
    if (!selectedArchetype || !playerName || !companyName) return;
    setLoading(true);
    const initialState: GameState = {
      turn: 0,
      playerName,
      companyName,
      archetypeId: selectedArchetype.id,
      inflationRate: 0,
      interestRate: 0,
      marketMood: setupData?.marketMood || 'Neutro',
      narrativeLog: [],
      corporate: {
        cash: selectedArchetype.startingCapital,
        revenue: 0,
        expenses: 0,
        debtService: 0,
        valuation: selectedArchetype.startingCapital,
        health: 'Solvente'
      },
      personal: {
        netWorth: 0,
        cash: 0,
        portfolio: 0,
        investments: [],
        passiveIncome: 0,
        lifestyleCost: 0,
        surplus: 0
      },
      currentOptions: [],
      isGameOver: false
    };
    try {
      const turnData = await GeminiService.processTurn(initialState);
      updateGameState(initialState, turnData);
      setPhase(GamePhase.PLAYING);
    } catch (err) {
      setError("Falha ao inicializar o mundo do jogo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (optionId: 'A' | 'B' | 'C') => {
    if (!gameState) return;
    setLoading(true);
    setError(null);
    const finalAllocation = customAllocation.trim() || surplusAllocation;
    try {
      const turnData = await GeminiService.processTurn(gameState, {
        choiceId: optionId,
        surplusAllocation: finalAllocation
      });
      updateGameState(gameState, turnData);
      setCustomAllocation('');
    } catch (err) {
      setError("O Mestre do Jogo está silencioso (Erro de Rede). Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const updateGameState = (prev: GameState, response: TurnResponse) => {
    const newState: GameState = {
      ...prev,
      turn: prev.turn + 1,
      narrativeLog: [
        ...prev.narrativeLog,
        {
          month: prev.turn + 1,
          text: response.narrative,
          eventSummary: response.event,
        }
      ],
      inflationRate: response.inflationRate,
      interestRate: response.interestRate,
      marketMood: response.marketContext,
      corporate: response.corporateUpdates,
      personal: response.personalUpdates,
      currentEvent: response.event,
      currentOptions: response.options,
      isGameOver: response.isGameOver,
      gameOverReason: response.gameOverReason
    };
    setGameState(newState);
    if (response.isGameOver) setPhase(GamePhase.GAME_OVER);
    
    // Always go back to overview when a new turn starts
    setActiveTab('overview');

    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // --- RENDERERS ---

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-rose-950/30 border border-rose-800 text-rose-200 p-6 rounded-lg max-w-md text-center">
          <AlertTriangle className="mx-auto mb-4 w-12 h-12" />
          <h2 className="text-xl font-bold mb-2">Falha no Sistema</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-rose-800 hover:bg-rose-700 rounded text-white font-mono text-sm">
            Reiniciar Terminal
          </button>
        </div>
      </div>
    );
  }

  if (loading && !gameState && phase === GamePhase.SETUP) {
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 gap-4">
            <Loader2 className="animate-spin w-8 h-8 text-emerald-500" />
            <span className="font-mono animate-pulse">Inicializando Simulação Financeira...</span>
        </div>
    );
  }

  // RENDER: SETUP (No changes to Setup UI)
  if (phase === GamePhase.SETUP && setupData) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 p-4 md:p-8 font-sans">
         <div className="max-w-4xl mx-auto space-y-8">
          <header className="space-y-2 text-center border-b border-zinc-800 pb-8">
             <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">TYCOON</h1>
             <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Mestre do Jogo Financeiro // Modo Hardcore</p>
          </header>

          <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
             <p className="text-lg text-zinc-300 leading-relaxed font-serif italic border-l-4 border-emerald-500 pl-4">
                "{setupData.intro}"
             </p>
             <div className="mt-4 flex gap-2 items-center text-sm font-mono text-amber-500">
                <TrendingUp size={16} />
                Humor do Mercado: {setupData.marketMood}
             </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {setupData.archetypes.map((arch) => (
               <div 
                 key={arch.id} 
                 onClick={() => setSelectedArchetype(arch)}
                 className={`cursor-pointer p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${selectedArchetype?.id === arch.id ? 'bg-zinc-900 border-emerald-500 ring-1 ring-emerald-500' : 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900'}`}
               >
                 <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{arch.name}</h3>
                    {selectedArchetype?.id === arch.id && <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>}
                 </div>
                 <p className="text-sm text-zinc-400 mb-4 min-h-[60px]">{arch.description}</p>
                 <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Capital</span>
                        <span className="text-emerald-400">{formatCurrency(arch.startingCapital)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Ativo</span>
                        <span className="text-blue-400">{arch.uniqueAsset}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Defeito</span>
                        <span className="text-rose-400">{arch.criticalFlaw}</span>
                    </div>
                 </div>
               </div>
            ))}
          </div>

          {selectedArchetype && (
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-2">Nome do Empreendedor</label>
                        <input 
                          type="text" 
                          value={playerName} 
                          onChange={(e) => setPlayerName(e.target.value)}
                          placeholder="João Silva"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs uppercase text-zinc-500 font-bold mb-2">Nome da Empresa</label>
                        <input 
                          type="text" 
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)} 
                          placeholder="Acme Ltda"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded p-3 text-white focus:border-emerald-500 focus:outline-none"
                        />
                    </div>
                </div>
                <button 
                  onClick={handleStartGame}
                  disabled={!playerName || !companyName || loading}
                  className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Play size={20} />}
                  INICIAR SIMULAÇÃO
                </button>
              </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER: MAIN GAME
  if (gameState) {
    const isProcessing = loading;
    
    // Tab Button Component
    const TabBtn = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex-1 md:flex-none justify-center ${activeTab === id ? 'border-emerald-500 text-emerald-400 bg-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
        >
            <Icon size={16} />
            <span className="hidden md:inline">{label}</span>
        </button>
    );

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-200 pb-20">
        
        {/* HEADER */}
        <div className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
            <div className="px-4 py-3 flex justify-between items-center max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center">
                        <Terminal size={16} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white leading-none">{gameState.companyName}</h1>
                        <span className="text-xs text-zinc-500 font-mono">CEO: {gameState.playerName}</span>
                    </div>
                </div>
            </div>
            
            {/* NAVIGATION TABS */}
            <div className="flex overflow-x-auto max-w-4xl mx-auto border-t border-zinc-900">
                <TabBtn id="overview" label="Visão Geral" icon={LayoutDashboard} />
                <TabBtn id="corporate" label="Corporativo (PJ)" icon={Building2} />
                <TabBtn id="personal" label="Pessoal (PF)" icon={User} />
                <TabBtn id="portfolio" label="Investimentos" icon={PieChart} />
            </div>
        </div>

        <div className="max-w-4xl mx-auto pt-8 px-4 space-y-8">
            
            {/* MACRO INDICATORS (Always Visible) */}
            <MacroHeader state={gameState} />

            {/* TAB CONTENT */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Summary Cards */}
                        <OverviewSummary state={gameState} />

                        {/* Narrative */}
                        <div className="space-y-4">
                            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} /> Narrativa Mensal
                            </h2>
                            <div className="prose prose-invert prose-p:text-zinc-300 prose-strong:text-white max-w-none">
                                <p className="text-lg leading-relaxed">{gameState.narrativeLog[gameState.narrativeLog.length - 1].text}</p>
                            </div>
                            
                            {gameState.currentEvent && !gameState.isGameOver && (
                                <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded-lg flex gap-4 items-start">
                                    <div className="bg-amber-900/20 p-2 rounded text-amber-500 mt-1">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-amber-500 font-bold text-sm uppercase mb-1">Dilema Detectado</h3>
                                        <p className="text-amber-100/80 text-sm">{gameState.currentEvent}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Decisions (Only on Overview) */}
                        {!gameState.isGameOver && (
                            <div className="space-y-6 pb-12">
                                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                    <Shield size={14} /> Decisões Estratégicas
                                </h2>
                                
                                {/* Surplus Allocation */}
                                <div className="bg-zinc-900/30 p-4 rounded-lg border border-zinc-800">
                                    <label className="block text-xs uppercase text-zinc-500 font-bold mb-3">
                                        Alocação do Excedente Pessoal ({formatCurrency(gameState.personal.surplus)})
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {['Reinvestir na Empresa', 'Comprar Ações', 'Guardar Dinheiro', 'Melhorar Estilo de Vida'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => { setSurplusAllocation(opt); setCustomAllocation(''); }}
                                                className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors ${surplusAllocation === opt && !customAllocation ? 'bg-emerald-900/50 border-emerald-500 text-emerald-200' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Ou digite uma estratégia personalizada..."
                                        value={customAllocation}
                                        onChange={(e) => setCustomAllocation(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>

                                {/* Options */}
                                <div className="grid md:grid-cols-3 gap-4">
                                    {gameState.currentOptions.map((opt) => {
                                        let borderColor = 'border-zinc-700 hover:border-zinc-500';
                                        let badgeColor = 'bg-zinc-800 text-zinc-400';
                                        
                                        if (opt.type === 'AGGRESSIVE') {
                                            borderColor = 'border-rose-900/50 hover:border-rose-500';
                                            badgeColor = 'bg-rose-950 text-rose-400';
                                        } else if (opt.type === 'CONSERVATIVE') {
                                            borderColor = 'border-blue-900/50 hover:border-blue-500';
                                            badgeColor = 'bg-blue-950 text-blue-400';
                                        } else {
                                            borderColor = 'border-purple-900/50 hover:border-purple-500';
                                            badgeColor = 'bg-purple-950 text-purple-400';
                                        }

                                        return (
                                            <button
                                                key={opt.id}
                                                disabled={isProcessing}
                                                onClick={() => handleDecision(opt.id)}
                                                className={`relative text-left p-5 rounded-xl border bg-zinc-900/40 transition-all duration-200 hover:bg-zinc-900 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group flex flex-col h-full ${borderColor}`}
                                            >
                                                <div className="mb-3 flex justify-between items-start">
                                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wider ${badgeColor}`}>
                                                        Opção {opt.id}
                                                    </span>
                                                    {isProcessing && <Loader2 className="animate-spin w-4 h-4 text-zinc-500" />}
                                                </div>
                                                <h3 className="text-sm font-bold text-zinc-200 mb-2 group-hover:text-white">{opt.label}</h3>
                                                <p className="text-xs text-zinc-400 leading-relaxed flex-grow">{opt.description}</p>
                                                
                                                <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center text-xs text-zinc-500 group-hover:text-zinc-300">
                                                    Selecionar Estratégia <ArrowRight size={12} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'corporate' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <CorporateView state={gameState} />
                    </div>
                )}

                {activeTab === 'personal' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <PersonalView state={gameState} />
                    </div>
                )}

                {activeTab === 'portfolio' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <PortfolioView state={gameState} />
                    </div>
                )}
            </div>

            {/* GAME OVER OVERLAY */}
            {gameState.isGameOver && (
                 <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                     <div className="bg-rose-950/20 border border-rose-900 p-8 rounded-xl text-center space-y-6 max-w-lg w-full">
                         <Skull className="w-16 h-16 text-rose-500 mx-auto" />
                         <div>
                             <h2 className="text-3xl font-bold text-white mb-2">FIM DE JOGO</h2>
                             <p className="text-rose-200 text-lg">{gameState.gameOverReason}</p>
                         </div>
                         <div className="font-mono text-zinc-500">
                            Você sobreviveu por {gameState.turn} meses.
                         </div>
                         <button onClick={() => window.location.reload()} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-bold w-full">
                            Jogar Novamente
                         </button>
                     </div>
                 </div>
            )}
            <div ref={bottomRef} />
        </div>
      </div>
    );
  }

  return null;
};

export default App;

function AlertTriangle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}
