
import { GoogleGenAI, Type } from "@google/genai";

export async function fetchExchangeRates() {
  if (!process.env.API_KEY) {
    console.warn("API_KEY não configurada. Usando valores padrão.");
    return getDefaultRates();
  }

  const today = new Date().toLocaleDateString('pt-PT', { 
    timeZone: 'Africa/Luanda',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Prompt mais agressivo para garantir dados de HOJE e taxas de VENDA
    const prompt = `Hoje é ${today}. Pesquise obrigatoriamente nos sites oficiais dos bancos angolanos (BAI, BCI, BFA e Atlântico) a TAXA DE CÂMBIO DE VENDA de USD para Kwanza (AOA). 
    IGNORE valores antigos. Retorne apenas um array JSON de objetos com 'bank' (string), 'rate' (number) e 'sourceUrl' (string do link direto do banco).
    Exemplo: [{"bank": "BAI", "rate": 915.5, "sourceUrl": "https://www.bai.ao"}]`;
    
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
              sourceUrl: { type: Type.STRING }
            },
            required: ["bank", "rate"]
          }
        }
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text || "";
    
    // Tenta extrair o JSON
    const jsonMatch = text.match(/\[.*\]/s);
    let results = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    
    // Se o modelo não retornou a URL no JSON, tenta pegar das grounding chunks
    if (Array.isArray(results)) {
      results = results.map((r: any, index: number) => {
        const foundUrl = r.sourceUrl || (groundingChunks[index] as any)?.web?.uri || groundingChunks[0]?.web?.uri;
        return { ...r, sourceUrl: foundUrl };
      });
    }
    
    return Array.isArray(results) && results.length > 0 ? results : getDefaultRates();
  } catch (error) {
    console.error("Erro ao buscar taxas de câmbio:", error);
    return getDefaultRates();
  }
}

function getDefaultRates() {
  return [
    { bank: 'BAI', rate: 915.50 },
    { bank: 'BCI', rate: 918.20 },
    { bank: 'BFA', rate: 916.00 },
    { bank: 'Atlântico', rate: 917.40 }
  ];
}
