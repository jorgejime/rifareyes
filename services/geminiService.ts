
import { GoogleGenAI } from "@google/genai";

export async function getLuckyMessage(number: string): Promise<string> {
  // IMPORTANT: This check is for the web app environment.
  // In a real-world scenario, you would use a backend proxy to protect the API key.
  if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Using a default message.");
    return `El número ${number} tiene una energía especial hoy. ¡Que te traiga suerte en tus próximos desafíos!`;
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Dame un dato curioso, un mensaje de la suerte, o un pequeño poema sobre el número ${number}. Sé muy breve (máximo 2 frases), positivo y amigable. La respuesta debe ser solo el texto, sin formato markdown. Responde en español.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error fetching lucky message from Gemini API:", error);
    return `El número ${number} brilla con potencial. ¡Hoy puede ser tu día de suerte!`;
  }
}
