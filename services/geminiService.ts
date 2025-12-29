import { GoogleGenAI } from "@google/genai";

// Initialize directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateDiagnosis = async (symptoms: string, vehicleInfo: string): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please configure your environment.";
  }

  try {
    const prompt = `
      Você é um especialista mecânico automotivo sênior. 
      Veículo: ${vehicleInfo}
      Sintomas relatados: ${symptoms}

      Por favor, forneça:
      1. Diagnóstico provável (liste 3 possibilidades em ordem de probabilidade).
      2. Peças que provavelmente precisarão ser verificadas ou trocadas.
      3. Estimativa de complexidade do serviço (Baixa, Média, Alta).
      
      Mantenha a resposta concisa, profissional e formatada para leitura rápida.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Não foi possível gerar um diagnóstico no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao consultar o assistente de IA. Verifique sua conexão.";
  }
};