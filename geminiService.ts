
import { GoogleGenAI, Type } from "@google/genai";

// Configuração para Next.js/Vercel: Força a execução dinâmica e evita build estático
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function fetchExchangeRates() {
  const serverTimestamp = new Date().toISOString();
  const requestId = Math.random().toString(36).substring(2, 15);

  console.log(`[TECH IMPORT LOG - ${serverTimestamp}] Iniciando busca de taxas de câmbio. RequestID: ${requestId}`);

  if (!process.env.API_KEY) {
    console.error(`[TECH IMPORT ERROR - ${serverTimestamp}] API_KEY não encontrada nas variáveis de ambiente da Vercel.`);
    return getDefaultRates();
  }

  const nowInLuanda = new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Africa/Luanda',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(new Date());

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    /**
     * PROMPT DE ALTA PRECISÃO:
     * 1. Inclui timestamp para quebrar cache do Gemini.
     * 2. Instruções de User-Agent simulado para o Google Search.
     * 3. Foco em taxas de VENDA (Sell Rate).
     */
    const prompt = `
      CONTEXTO DE TEMPO REAL:
      - SERVER_TIMESTAMP: ${serverTimestamp}
      - CURRENT_LUANDA_TIME: ${nowInLuanda}
      - REQUEST_ID: ${requestId}
      
      INSTRUÇÕES CRÍTICAS PARA GOOGLE SEARCH:
      - Atue como um navegador desktop real (User-Agent atualizado).
      - Não utilize resultados de cache de pesquisas anteriores.
      - Acesse os sites oficiais dos bancos angolanos AGORA: BAI, BFA, BCI, Atlântico.
      - Extraia a TAXA DE VENDA (Sell Rate) de USD para AOA válida para hoje.
      
      REFERÊNCIAS:
      - BAI (https://www.bai.ao/pt/)
      - BFA (https://www.bfa.ao/pt/particulares/cambio/)
      - Atlântico (https://www.atlantico.ao/)
      - BCI (https://www.bci.ao/)
      
      FORMATO DE RESPOSTA OBRIGATÓRIO (JSON APENAS):
      [{"bank": "Nome", "rate": 000.00, "publishedAt": "Data/Hora no Site", "sourceUrl": "URL Direta"}]
    `;
    
    console.log(`[TECH IMPORT LOG - ${serverTimestamp}] Chamando Gemini API (gemini-3-flash-preview)...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        // Cache bypass via headers se suportado pelo SDK, caso contrário o prompt com ID resolve
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              bank: { type: Type.STRING },
              rate: { type: Type.NUMBER },
              publishedAt: { type: Type.STRING },
              sourceUrl: { type: Type.STRING }
            },
            required: ["bank", "rate"]
          }
        }
      },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    console.log(`[TECH IMPORT LOG - ${serverTimestamp}] Resposta recebida. Grounding verificada: ${!!groundingMetadata}`);

    let text = response.text || "";
    text = text.trim();
    
    // Sanitização de blocos de código Markdown
    if (text.startsWith("```")) {
      text = text.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
    }
    
    const results = JSON.parse(text);
    
    if (Array.isArray(results) && results.length > 0) {
      console.log(`[TECH IMPORT SUCCESS - ${serverTimestamp}] ${results.length} bancos processados com sucesso.`);
      
      return results.map((r: any) => ({
        ...r,
        lastUpdate: new Date().toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' })
      }));
    }
    
    throw new Error("JSON retornado vazio ou em formato inválido.");

  } catch (error) {
    console.error(`[TECH IMPORT FATAL - ${serverTimestamp}] Falha na sincronização:`, error);
    // Em caso de erro, retornamos os valores padrão para não quebrar a UI, 
    // mas os logs acima ajudarão a diagnosticar o bloqueio na Vercel.
    return getDefaultRates();
  }
}

function getDefaultRates() {
  const time = new Date().toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' });
  console.warn(`[TECH IMPORT WARN] Utilizando taxas de salvaguarda (offline mode).`);
  return [
    { bank: 'BAI', rate: 915.50, lastUpdate: time, publishedAt: 'Servidor Offline' },
    { bank: 'BCI', rate: 918.20, lastUpdate: time, publishedAt: 'Servidor Offline' },
    { bank: 'BFA', rate: 916.00, lastUpdate: time, publishedAt: 'Servidor Offline' },
    { bank: 'Atlântico', rate: 917.40, lastUpdate: time, publishedAt: 'Servidor Offline' }
  ];
}
