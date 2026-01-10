
import { GoogleGenAI, Type } from "@google/genai";

export async function fetchExchangeRates() {
  if (!process.env.API_KEY) {
    console.warn("API_KEY não configurada. Usando valores padrão.");
    return getDefaultRates();
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString('pt-PT', { timeZone: 'Africa/Luanda' });
  const timeStr = now.toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Prompt extremamente específico para evitar alucinações e dados obsoletos
    const prompt = `Aja como um analista financeiro angolano. HOJE É ${todayStr}, HORA ATUAL: ${timeStr}.
    Aceda agora aos sites oficiais dos bancos: BAI (Banco Angolano de Investimentos), BCI (Banco de Comércio e Indústria), BFA (Banco de Fomento Angola) e Banco Atlântico.
    Extraia o valor exato da TAXA DE CÂMBIO DE VENDA para USD (Dólar Americano) -> AOA (Kwanza).
    
    REGRAS CRÍTICAS:
    1. Ignore qualquer valor que não seja de HOJE (${todayStr}).
    2. Se o site do banco não tiver o valor de hoje, tente encontrar a última atualização oficial no site.
    3. Retorne EXCLUSIVAMENTE um JSON array com:
       - 'bank': Nome do banco.
       - 'rate': O número decimal exato.
       - 'publishedAt': A data/hora que consta no site do banco para essa taxa.
       - 'sourceUrl': O link direto para a página de câmbio do banco.

    Sites sugeridos para busca:
    - https://www.bai.ao/pt/
    - https://www.bfa.ao/pt/particulares/cambio/
    - https://www.atlantico.ao/
    - https://www.bci.ao/`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Mudança para Pro para raciocínio complexo de busca
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
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

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text || "";
    
    const jsonMatch = text.match(/\[.*\]/s);
    let results = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    
    if (Array.isArray(results)) {
      results = results.map((r: any, index: number) => {
        // Tenta garantir que o sourceUrl seja o mais preciso possível vindo do grounding
        const foundUrl = r.sourceUrl || (groundingChunks[index] as any)?.web?.uri || groundingChunks[0]?.web?.uri;
        return { 
          ...r, 
          sourceUrl: foundUrl,
          lastUpdate: timeStr
        };
      });
    }
    
    return Array.isArray(results) && results.length > 0 ? results : getDefaultRates();
  } catch (error) {
    console.error("Erro fatal ao buscar taxas em tempo real:", error);
    return getDefaultRates();
  }
}

function getDefaultRates() {
  const time = new Date().toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' });
  return [
    { bank: 'BAI', rate: 915.50, lastUpdate: time, publishedAt: 'Padrão' },
    { bank: 'BCI', rate: 918.20, lastUpdate: time, publishedAt: 'Padrão' },
    { bank: 'BFA', rate: 916.00, lastUpdate: time, publishedAt: 'Padrão' },
    { bank: 'Atlântico', rate: 917.40, lastUpdate: time, publishedAt: 'Padrão' }
  ];
}
