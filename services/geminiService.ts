import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Archetype, GameState, SetupResponse, TurnResponse } from "../types";

const SYSTEM_INSTRUCTION = `
IDENTIDADE E OBJETIVO
Você é o "Mestre do Jogo Financeiro", uma IA sofisticada que simula uma jornada empresarial hiper-realista e de alto risco.
Tom: Mentor rigoroso, analítico (CFO de Wall Street), narrativa vívida.
Dificuldade: HARDCORE. Sem "plot armor". Inflação, processos trabalhistas, juros altos e concorrentes agressivos são ameaças reais.
Idioma: PORTUGUÊS BRASILEIRO (pt-BR).

REGRAS CENTRAIS:
1.  **Separação Patrimonial Rigorosa**: Finanças Corporativas (PJ) e Pessoais (PF) são distintas. Misturar os caixas é crime de governança.
2.  **Turnos**: Mensais.
3.  **Economia**: Alta volatilidade (Contexto Brasil/Emergente). Acompanhe a Taxa Selic (Juros Base) e a Inflação.
4.  **Financeiro**: Calcule mudanças financeiras realistas com base nas decisões do usuário.
5.  **Investimentos**: Mantenha um rastreamento detalhado dos investimentos pessoais (Ações, Renda Fixa, etc.) e seus rendimentos mensais.

FORMATO DE SAÍDA:
Responda APENAS em JSON, seguindo os schemas fornecidos nas definições de função.
`;

// Initialize Gemini
// NOTE: We assume process.env.API_KEY is available as per instructions.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Fetch the initial setup: Intro and 3 Archetypes.
 */
export const fetchSetup = async (): Promise<SetupResponse> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      intro: { type: Type.STRING, description: "Introdução atmosférica definindo o humor econômico." },
      marketMood: { type: Type.STRING, description: "Descrição curta do mercado (ex: 'Recessão', 'Aquecido')." },
      archetypes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            startingCapital: { type: Type.NUMBER, description: "Entre 5000 e 25000" },
            uniqueAsset: { type: Type.STRING },
            criticalFlaw: { type: Type.STRING },
          },
          required: ["id", "name", "description", "startingCapital", "uniqueAsset", "criticalFlaw"],
        },
      },
    },
    required: ["intro", "marketMood", "archetypes"],
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: "Inicialize a Fase 1: A Configuração. Forneça uma introdução atmosférica e 3 arquétipos iniciais distintos (Herdeiro Desonrado, Hacker de Garagem, Vendedor de Rua).",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text) as SetupResponse;
};

/**
 * Process a turn. Takes current state and user decision, returns new state.
 */
export const processTurn = async (
  currentState: GameState,
  decision?: { choiceId: 'A' | 'B' | 'C'; surplusAllocation: string }
): Promise<TurnResponse> => {
  
  const isFirstTurn = currentState.turn === 0;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      narrative: { type: Type.STRING, description: "Descrição vívida dos eventos do mês e o resultado da decisão anterior." },
      marketContext: { type: Type.STRING, description: "Status atual do mercado (ex: 'Rali do Setor', 'Crise de Crédito')." },
      inflationRate: { type: Type.NUMBER, description: "Taxa de inflação atual (%)." },
      interestRate: { type: Type.NUMBER, description: "Taxa básica de juros (Selic) atual (%)." },
      corporateUpdates: {
        type: Type.OBJECT,
        properties: {
          cash: { type: Type.NUMBER },
          revenue: { type: Type.NUMBER },
          expenses: { type: Type.NUMBER },
          debtService: { type: Type.NUMBER },
          valuation: { type: Type.NUMBER },
          health: { type: Type.STRING, description: "Solvente, Crise de Caixa, ou Falência" },
        },
        required: ["cash", "revenue", "expenses", "debtService", "valuation", "health"]
      },
      personalUpdates: {
        type: Type.OBJECT,
        properties: {
          netWorth: { type: Type.NUMBER },
          cash: { type: Type.NUMBER },
          portfolio: { type: Type.NUMBER, description: "Valor total investido." },
          investments: {
             type: Type.ARRAY,
             description: "Lista detalhada dos investimentos e seus rendimentos.",
             items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Ex: 'Tesouro Direto', 'Ações PETR4'" },
                    type: { type: Type.STRING, enum: ['Renda Fixa', 'Ações', 'FIIs', 'Cripto', 'Reserva'] },
                    amount: { type: Type.NUMBER, description: "Valor atual do ativo." },
                    monthlyYield: { type: Type.NUMBER, description: "Rendimento em dinheiro neste mês." },
                    yieldRate: { type: Type.NUMBER, description: "Rendimento percentual neste mês." }
                },
                required: ["name", "type", "amount", "monthlyYield", "yieldRate"]
             }
          },
          passiveIncome: { type: Type.NUMBER },
          lifestyleCost: { type: Type.NUMBER },
          surplus: { type: Type.NUMBER },
        },
        required: ["netWorth", "cash", "portfolio", "investments", "passiveIncome", "lifestyleCost", "surplus"]
      },
      event: { type: Type.STRING, description: "O conflito ou dilema específico para este mês." },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, enum: ["A", "B", "C"] },
            label: { type: Type.STRING, description: "Título curto (ex: 'Expansão Agressiva')" },
            description: { type: Type.STRING, description: "Descrição da escolha estratégica." },
            type: { type: Type.STRING, enum: ["AGGRESSIVE", "CONSERVATIVE", "CREATIVE"] }
          },
          required: ["id", "label", "description", "type"]
        }
      },
      isGameOver: { type: Type.BOOLEAN },
      gameOverReason: { type: Type.STRING },
    },
    required: ["narrative", "corporateUpdates", "personalUpdates", "event", "options", "isGameOver"],
  };

  let prompt = "";
  
  if (isFirstTurn) {
    prompt = `
      INICIAR JOGO.
      Nome do Jogador: ${currentState.playerName}
      Nome da Empresa: ${currentState.companyName}
      ID do Arquétipo Selecionado: ${currentState.archetypeId}
      
      Gere as estatísticas do Mês 1, uma narrativa inicial e o primeiro dilema.
      Defina os valores iniciais.
      IMPORTANTE: A lista de 'investments' deve começar vazia ou com valores mínimos dependendo do arquétipo.
    `;
  } else {
    prompt = `
      RESOLVER TURNO ${currentState.turn} -> GERAR TURNO ${currentState.turn + 1}.
      
      ESTADO ATUAL (Antes de Processar a Decisão):
      ${JSON.stringify(currentState, null, 2)}
      
      DECISÃO DO JOGADOR:
      Escolha: ${decision?.choiceId}
      Estratégia de Alocação do Excedente Pessoal: ${decision?.surplusAllocation}
      
      INSTRUÇÕES:
      1. Calcule o impacto financeiro na PJ e PF.
      2. ATUALIZE OS INVESTIMENTOS:
         - Se o jogador investiu o excedente, adicione ao ativo apropriado ou crie um novo.
         - Aplique o rendimento do mês (baseado na Selic ou risco do ativo) a cada investimento existente na lista 'investments'.
         - Calcule o 'monthlyYield' e 'yieldRate' para cada item.
         - A soma dos 'monthlyYield' deve refletir em 'passiveIncome'.
      3. Avance a linha do tempo.
      4. Gere novo Evento e Opções.
    `;
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: schema,
      // Increased thinking budget for array calculations
      thinkingConfig: { thinkingBudget: 2048 }
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  return JSON.parse(response.text) as TurnResponse;
};