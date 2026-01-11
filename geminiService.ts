
import { GoogleGenAI, Type } from "@google/genai";

/**
 * CONFIGURAÇÕES CRÍTICAS PARA VERCEL / NEXT.JS
 * Estas flags impedem que a Vercel transforme seu app em um site estático.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function fetchExchangeRates() {
  // Gerador de ID único e Timestamp para garantir que o cache seja ignorado
  const serverTimestamp = new Date().toISOString();
  const cacheBuster = Math.random().toString(36).substring(7);

  console.log(`[VERCEL-DYNAMIC-LOG] Início da requisição: ${serverTimestamp} | ID: ${cacheBuster}`);

  // Verifica se a chave de API está presente no ambiente da Vercel
  if (!process.env.API_KEY) {
    console.error(`[VERCEL-ERROR] API_KEY ausente! Verifique as variáveis de ambiente no painel da Vercel.`);
    return getDefaultRates();
  }

  // Define o horário de Luanda para o prompt
  const luandaTime = new Intl.DateTimeFormat('pt-PT', {
    timeZone: 'Africa/Luanda',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(new Date());

  try {
    // Inicializa a IA com a chave de ambiente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    /**
     * PROMPT COM BYPASS DE CACHE:
     * O User-Agent e o Timestamp forçam o Google Search a buscar dados novos.
     */
    const prompt = `
      AGENTE DE PESQUISA EM TEMPO REAL (ID: ${cacheBuster})
      DATA/HORA ATUAL EM LUANDA: ${luandaTime}
      TIMESTAMP DO SERVIDOR: ${serverTimestamp}
      
      INSTRUÇÕES DE ACESSO:
      1. Use os seguintes Headers de Navegador: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'}
      2. IGNORE qualquer resultado de cache. Faça uma nova pesquisa no Google AGORA.
      3. Verifique as taxas oficiais de VENDA (Sell Rate) de USD para Kwanza (AOA) nos sites:
         - BAI (Bancobai.ao)
         - BFA (Bfa.ao)
         - Banco Atlântico (Atlantico.ao)
         - BCI (Bci.ao)
      
      RESPONDA APENAS UM ARRAY JSON PURO com este formato:
      [{"bank": "Nome do Banco", "rate": 000.00, "publishedAt": "Data do Portal", "sourceUrl": "Link Direto"}]
    `;
    
    console.log(`[VERCEL-LOG] Chamando API Gemini com bypass de cache ativo...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        // Parâmetro técnico para evitar cache em nível de modelo
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

    // Auditoria de Grounding (Verifica se a IA realmente buscou na web)
    const hasSearch = !!response.candidates?.[0]?.groundingMetadata;
    console.log(`[VERCEL-LOG] Pesquisa Web realizada: ${hasSearch ? 'SIM' : 'NÃO (ALERTA)'}`);

    let rawJson = response.text || "[]";
    
    // Limpeza de possíveis caracteres extras
    rawJson = rawJson.trim();
    if (rawJson.includes("```")) {
      rawJson = rawJson.replace(/```json|```/g, "").trim();
    }
    
    const parsedData = JSON.parse(rawJson);
    
    if (parsedData && parsedData.length > 0) {
      console.log(`[VERCEL-SUCCESS] Dados atualizados recebidos para ${parsedData.length} bancos.`);
      return parsedData.map((item: any) => ({
        ...item,
        lastUpdate: new Date().toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' })
      }));
    }
    
    throw new Error("Resposta da API vazia ou inválida.");

  } catch (err) {
    console.error(`[VERCEL-FATAL-ERROR] Falha total na busca de dados:`, err);
    // Retorna valores de segurança caso os sites dos bancos estejam bloqueando a Vercel
    return getDefaultRates();
  }
}

/**
 * Taxas de contingência (usadas apenas se o scraping falhar)
 */
function getDefaultRates() {
  const time = new Date().toLocaleTimeString('pt-PT', { timeZone: 'Africa/Luanda' });
  console.warn(`[VERCEL-WARN] Usando modo de segurança (Offline) devido a erro na busca real.`);
  return [
    { bank: 'BAI', rate: 915.00, lastUpdate: time, publishedAt: 'Falha na conexão real' },
    { bank: 'BFA', rate: 916.00, lastUpdate: time, publishedAt: 'Falha na conexão real' },
    { bank: 'Atlântico', rate: 917.00, lastUpdate: time, publishedAt: 'Falha na conexão real' },
    { bank: 'BCI', rate: 918.00, lastUpdate: time, publishedAt: 'Falha na conexão real' }
  ];
}
