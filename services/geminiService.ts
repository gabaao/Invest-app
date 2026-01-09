import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Archetype, GameState, SetupResponse, TurnResponse } from "../types";

const SYSTEM_INSTRUCTION = `
IDENTIDADE E OBJETIVO
Você é o "Mestre do Jogo Financeiro", uma IA sofisticada que simula uma jornada empresarial hiper-realista e de alto risco.
Tom: Mentor rigoroso, analítico (CFO de Wall Street), narrativa vívida.
Dificuldade: HARDCORE.

REGRAS CENTRAIS:
1.  **Separação Patrimonial**: Finanças Corporativas (PJ) e Pessoais (PF) são distintas.
2.  **Economia Viva**: Crie "Breaking News" (Manchetes) que dão pistas sobre o mercado.
3.  **Rivalidade**: O jogador tem um RIVAL definido. Inclua ações desse rival na narrativa ocasionalmente (ex: roubando clientes, sabotagem, ofertas hostis).
4.  **Saúde Mental (STRESS)**:
    *   Monitore o nível de Stress (0 a 100) na PF.
    *   Decisões "AGGRESSIVE" ou crises aumentam o Stress (+10 a +25).
    *   Gastar excedente em "Lifestyle" ou tirar férias (opções Conservative) reduz o Stress (-10 a -30).
    *   Se Stress >= 100: Ocorrer um "BURNOUT". O jogador vai para o hospital, paga uma conta alta e perde produtividade (lucro cai).
5.  **Cash Drag**: Inflação corrói dinheiro parado.
6.  **Vitória**: Patrimônio Líquido PF > R$ 5.000.000 + Renda Passiva > Custo de Vida.

ATMOSFERA DE MERCADO (marketMood):
Classifique sempre como: "Bull Market" (Otimismo), "Bear Market" (Pessimismo), "Recessão", "Crash" ou "Estagnado".

FORMATO DE SAÍDA:
Responda APENAS em JSON limpo.
`;

// Helper to clean Markdown from JSON
const cleanAndParseJSON = <T>(text: string): T => {
  try {
    const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON from Gemini:", text);
    throw new Error("Invalid JSON response from AI Model");
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Fetch the initial setup including a generated Rival
 */
export const fetchSetup = async (): Promise<SetupResponse> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      intro: { type: Type.STRING },
      marketMood: { type: Type.STRING },
      archetypes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            startingCapital: { type: Type.NUMBER },
            uniqueAsset: { type: Type.STRING },
            criticalFlaw: { type: Type.STRING },
          },
          required: ["id", "name", "description", "startingCapital", "uniqueAsset", "criticalFlaw"],
        },
      },
      rival: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            companyName: { type: Type.STRING },
            description: { type: Type.STRING },
            archetype: { type: Type.STRING },
        },
        required: ["name", "companyName", "description", "archetype"]
      }
    },
    required: ["intro", "marketMood", "archetypes", "rival"],
  };

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: "Inicialize a Fase 1: A Configuração. Introdução, 3 arquétipos de jogador e 1 RIVAL (Antagonista) que competirá com o jogador.",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  return cleanAndParseJSON<SetupResponse>(response.text);
};

/**
 * Process a turn
 */
export const processTurn = async (
  currentState: GameState,
  decision?: { choiceId: 'A' | 'B' | 'C'; surplusAllocation: string }
): Promise<TurnResponse> => {
  
  const isFirstTurn = currentState.turn === 0;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      narrative: { type: Type.STRING },
      marketContext: { type: Type.STRING },
      headlines: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "3 a 5 manchetes curtas de notícias fictícias que afetam o mundo do jogo."
      },
      inflationRate: { type: Type.NUMBER },
      interestRate: { type: Type.NUMBER },
      corporateUpdates: {
        type: Type.OBJECT,
        properties: {
          cash: { type: Type.NUMBER },
          revenue: { type: Type.NUMBER },
          expenses: { type: Type.NUMBER },
          debtService: { type: Type.NUMBER },
          valuation: { type: Type.NUMBER },
          health: { type: Type.STRING },
        },
        required: ["cash", "revenue", "expenses", "debtService", "valuation", "health"]
      },
      personalUpdates: {
        type: Type.OBJECT,
        properties: {
          netWorth: { type: Type.NUMBER },
          cash: { type: Type.NUMBER },
          portfolio: { type: Type.NUMBER },
          investments: {
             type: Type.ARRAY,
             items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Renda Fixa', 'Ações', 'FIIs', 'Cripto', 'Reserva'] },
                    amount: { type: Type.NUMBER },
                    monthlyYield: { type: Type.NUMBER },
                    yieldRate: { type: Type.NUMBER }
                },
                required: ["name", "type", "amount", "monthlyYield", "yieldRate"]
             }
          },
          passiveIncome: { type: Type.NUMBER },
          lifestyleCost: { type: Type.NUMBER },
          surplus: { type: Type.NUMBER },
          stress: { type: Type.NUMBER, description: "Nível de stress acumulado (0-100)." },
        },
        required: ["netWorth", "cash", "portfolio", "investments", "passiveIncome", "lifestyleCost", "surplus", "stress"]
      },
      event: { type: Type.STRING },
      options: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, enum: ["A", "B", "C"] },
            label: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["AGGRESSIVE", "CONSERVATIVE", "CREATIVE"] }
          },
          required: ["id", "label", "description", "type"]
        }
      },
      isGameOver: { type: Type.BOOLEAN },
      gameOverReason: { type: Type.STRING },
      isVictory: { type: Type.BOOLEAN },
    },
    required: ["narrative", "marketContext", "headlines", "corporateUpdates", "personalUpdates", "event", "options", "isGameOver"],
  };

  let prompt = "";
  
  if (isFirstTurn) {
    prompt = `
      INICIAR JOGO.
      Nome: ${currentState.playerName}
      Empresa: ${currentState.companyName}
      Arquétipo: ${currentState.archetypeId}
      Rival: ${currentState.rival ? JSON.stringify(currentState.rival) : "Desconhecido"}
      
      Gere estatísticas Mês 1. Defina stress inicial baixo (0-10).
    `;
  } else {
    prompt = `
      RESOLVER TURNO ${currentState.turn} -> GERAR TURNO ${currentState.turn + 1}.
      
      ESTADO ATUAL:
      ${JSON.stringify(currentState, null, 2)}
      
      DECISÃO:
      Escolha: ${decision?.choiceId}
      Alocação Excedente: ${decision?.surplusAllocation}
      
      LEMBRETE: Atualize o 'stress' na PF baseado na decisão. Se > 100, cause Burnout.
      LEMBRETE: O Rival (${currentState.rival?.name}) deve estar fazendo algo.
    `;
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: schema,
      thinkingConfig: { thinkingBudget: 2048 }
    },
  });

  if (!response.text) throw new Error("No response from Gemini");
  return cleanAndParseJSON<TurnResponse>(response.text);
};