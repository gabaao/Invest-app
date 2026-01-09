// Enums
export enum GamePhase {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

// Financial Structures
export interface CorporateFinance {
  cash: number;
  revenue: number;
  expenses: number; // OpEx + COGS
  debtService: number;
  valuation: number;
  health: string;
}

export interface Investment {
  name: string;
  type: 'Renda Fixa' | 'Ações' | 'FIIs' | 'Cripto' | 'Reserva';
  amount: number;
  monthlyYield: number; // Value gained/lost this month
  yieldRate: number; // Percentage
}

export interface PersonalFinance {
  netWorth: number;
  cash: number;
  portfolio: number;
  investments: Investment[]; // Detailed breakdown
  passiveIncome: number;
  lifestyleCost: number;
  surplus: number;
}

// Game Data Structures
export interface Archetype {
  id: string;
  name: string; // e.g., "The Garage Hacker"
  description: string;
  startingCapital: number;
  uniqueAsset: string;
  criticalFlaw: string;
}

export interface GameOption {
  id: 'A' | 'B' | 'C';
  label: string; // "High Risk / Aggressive"
  description: string;
  type: 'AGGRESSIVE' | 'CONSERVATIVE' | 'CREATIVE';
}

export interface GameState {
  turn: number; // Month count
  playerName: string;
  companyName: string;
  archetypeId: string;
  
  // Indicators
  inflationRate: number;
  interestRate: number;
  marketMood: string;

  // Narrative
  narrativeLog: NarrativeLog[];
  
  // Financials
  corporate: CorporateFinance;
  personal: PersonalFinance;
  
  // Current Turn Data
  currentEvent?: string;
  currentOptions: GameOption[];
  
  isGameOver: boolean;
  gameOverReason?: string;
}

export interface NarrativeLog {
  month: number;
  text: string;
  eventSummary: string;
  decisionMade?: string;
  outcomeSummary?: string;
}

// API Responses
export interface SetupResponse {
  intro: string;
  marketMood: string;
  archetypes: Archetype[];
}

export interface TurnResponse {
  narrative: string;
  marketContext: string; // Up/Down/Crash
  inflationRate: number;
  interestRate: number;
  
  corporateUpdates: CorporateFinance;
  personalUpdates: PersonalFinance;
  
  event: string;
  options: GameOption[];
  
  isGameOver: boolean;
  gameOverReason?: string;
}