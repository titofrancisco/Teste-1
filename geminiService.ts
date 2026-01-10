
import { GoogleGenAI, Type } from "@google/genai";

// O Vite substituirá process.env.API_KEY durante o build graças ao vite.config.ts
const apiKey = process.env.API_KEY;

export async function fetchExchangeRates() {
  if (!apiKey) {
    console.warn("API_KEY não configurada. Usando valores padrão.");
    return getDefaultRates();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = "Quais são as taxas de câmbio atuais de venda de USD para Kwanza (AOA) nos bancos angolanos BAI, BCI, BFA e Atlântico? Retorne obrigatoriamente um array JSON de objetos com 'bank' (string) e 'rate' (number).";
    
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
            },
            required: ["bank", "rate"]
          }
        }
      },
    });

    const text = response.text;
    // Tentar extrair JSON caso o modelo retorne texto extra
    const jsonMatch = text.match(/\[.*\]/s);
    const results = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    
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
