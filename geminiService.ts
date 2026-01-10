
import { GoogleGenAI, Type } from "@google/genai";

export async function fetchExchangeRates() {
  if (!process.env.API_KEY) {
    console.error("ERRO CRÍTICO: API_KEY não configurada no ambiente (Vercel Environment Variables).");
    return getDefaultRates();
  }

  const now = new Date();
  const todayStr = now.toLocaleDateString('pt-PT', { timeZone: 'Africa/Luanda' });
  const timeStr = now.toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' });
  const salt = Math.random().toString(36).substring(7); // Força refresh da busca

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Usamos o gemini-3-flash-preview para menor latência em rede
    const prompt = `DATA_REF: ${todayStr} ${timeStr} (REF_ID: ${salt}).
    PESQUISA OBRIGATÓRIA: Vá aos sites oficiais do Banco BAI, BFA, BCI e Banco Atlântico.
    TAREFA: Extraia a taxa de câmbio de VENDA (Sell Rate) de USD para AOA (Kwanza) válida para HOJE, ${todayStr}.
    
    REGRAS DE EXTRAÇÃO:
    1. Se o banco apresentar taxas diferentes para 'Compra' e 'Venda', use APENAS a taxa de 'VENDA'.
    2. Ignore valores de datas passadas.
    3. Retorne APENAS um JSON no formato:
       [{"bank": "Nome", "rate": 000.00, "publishedAt": "Data do Site", "sourceUrl": "URL"}]
    
    URLS DE REFERÊNCIA:
    - BAI: https://www.bai.ao/pt/
    - BFA: https://www.bfa.ao/pt/particulares/cambio/
    - Atlântico: https://www.atlantico.ao/
    - BCI: https://www.bci.ao/`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    let text = response.text || "";
    
    // Limpeza rigorosa para garantir que apenas o JSON seja processado
    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/^```json/, "").replace(/```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```/, "").replace(/```$/, "");
    }
    
    const jsonMatch = text.match(/\[.*\]/s);
    let results = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    
    if (Array.isArray(results)) {
      return results.map((r: any, index: number) => {
        // Vincula URLs do grounding caso o JSON venha incompleto
        const foundUrl = r.sourceUrl || (groundingChunks[index] as any)?.web?.uri || (groundingChunks[0] as any)?.web?.uri || "";
        return { 
          ...r, 
          sourceUrl: foundUrl,
          lastUpdate: timeStr
        };
      });
    }
    
    throw new Error("Formato de resposta inválido");
  } catch (error) {
    console.warn("Gemini falhou ou API Key ausente. Usando valores de salvaguarda.");
    return getDefaultRates();
  }
}

function getDefaultRates() {
  const time = new Date().toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' });
  return [
    { bank: 'BAI', rate: 915.50, lastUpdate: time, publishedAt: 'Padrão (Offline)' },
    { bank: 'BCI', rate: 918.20, lastUpdate: time, publishedAt: 'Padrão (Offline)' },
    { bank: 'BFA', rate: 916.00, lastUpdate: time, publishedAt: 'Padrão (Offline)' },
    { bank: 'Atlântico', rate: 917.40, lastUpdate: time, publishedAt: 'Padrão (Offline)' }
  ];
}
