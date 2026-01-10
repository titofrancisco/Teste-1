
import { GoogleGenAI, Type } from "@google/genai";

// Guideline: Always use process.env.API_KEY directly when initializing.
export async function fetchExchangeRates() {
  if (!process.env.API_KEY) {
    console.warn("API_KEY não configurada. Usando valores padrão.");
    return getDefaultRates();
  }

  try {
    // Guideline: Always use new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

    // Extract grounding URLs as per guideline: "If Google Search is used, you MUST ALWAYS extract the URLs from groundingChunks and list them on the web app."
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = groundingChunks
      .filter((chunk: any) => chunk.web && chunk.web.uri)
      .map((chunk: any) => chunk.web.uri);

    // Guideline: Access generated text via the .text property (not a method).
    const text = response.text || "";
    // Tentar extrair JSON caso o modelo retorne texto extra ou citações
    const jsonMatch = text.match(/\[.*\]/s);
    let results = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    
    // Attach grounding info to the results if available
    if (Array.isArray(results) && sourceUrls.length > 0) {
      results = results.map((r: any) => ({ ...r, sourceUrl: sourceUrls[0] }));
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
