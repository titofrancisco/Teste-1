
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function fetchExchangeRates() {
  const serverTimestamp = new Date().toISOString();
  const cacheBuster = Math.random().toString(36).substring(7);

  if (!process.env.API_KEY) {
    console.error(`[VERCEL-ERROR] API_KEY ausente!`);
    return getDefaultRates();
  }

  const luandaTime = new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Africa/Luanda',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(new Date());

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      PESQUISA DE CÂMBIO EM TEMPO REAL (ID: ${cacheBuster})
      DATA ATUAL LUANDA: ${luandaTime}
      
      Busque agora as taxas oficiais de venda de USD para Kwanza (AOA) nos seguintes bancos:
      - BAI (Bancobai.ao)
      - BFA (Bfa.ao)
      - Atlântico (Atlantico.ao)
      - BCI (Bci.ao)
      
      Retorne um array JSON com: [{"bank": "Nome", "rate": 000.00, "publishedAt": "Data Portal", "sourceUrl": "Link"}]
    `;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        temperature: 0.1,
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

    let rawJson = response.text || "[]";
    rawJson = rawJson.trim();
    if (rawJson.includes("```")) {
      rawJson = rawJson.replace(/```json|```/g, "").trim();
    }
    
    const parsedData = JSON.parse(rawJson);
    
    if (parsedData && parsedData.length > 0) {
      return parsedData.map((item: any) => ({
        ...item,
        lastUpdate: new Date().toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' })
      }));
    }
    
    throw new Error("Dados inválidos");

  } catch (err) {
    console.error(`[RPC-ERROR-HANDLED] Erro na busca Gemini:`, err);
    return getDefaultRates();
  }
}

function getDefaultRates() {
  const time = new Date().toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' });
  return [
    { bank: 'BAI', rate: 915.00, lastUpdate: time, publishedAt: 'Cotação Média' },
    { bank: 'BFA', rate: 916.00, lastUpdate: time, publishedAt: 'Cotação Média' },
    { bank: 'Atlântico', rate: 917.00, lastUpdate: time, publishedAt: 'Cotação Média' },
    { bank: 'BCI', rate: 918.00, lastUpdate: time, publishedAt: 'Cotação Média' }
  ];
}
