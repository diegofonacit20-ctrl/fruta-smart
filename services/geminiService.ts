
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Product, Transaction } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Análisis y Chat con Búsqueda/Mapas
export const chatWithGemini = async (message: string, history: any[] = [], useThinking = false) => {
  const ai = getAI();
  const config: any = {
    tools: [{ googleSearch: {} }],
  };

  if (useThinking) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history, { role: 'user', parts: [{ text: message }] }],
    config
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

// 2. Generación de Imágenes (Pro)
export const generateImage = async (prompt: string, aspectRatio: string = "1:1", size: string = "1K") => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      imageConfig: { aspectRatio, imageSize: size as any }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// 3. Edición de Imágenes (Flash Image)
export const editImage = async (base64Image: string, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/png' } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

// 4. Generación de Video (Veo)
export const generateVeoVideo = async (prompt: string, imageBase64?: string) => {
  const ai = getAI();
  const config: any = {
    numberOfVideos: 1,
    resolution: '720p',
    aspectRatio: '16:9'
  };

  const payload: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config
  };

  if (imageBase64) {
    payload.image = {
      imageBytes: imageBase64.split(',')[1],
      mimeType: 'image/png'
    };
  }

  let operation = await ai.models.generateVideos(payload);
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoResponse.blob();
  return URL.createObjectURL(blob);
};

// 5. TTS (Text to Speech)
export const textToSpeech = async (text: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      }
    }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
};

// 6. Tasa BCV (Existente mejorada)
export const getLatestBCVRate = async () => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'Dame la tasa oficial del BCV para hoy en Venezuela (USD/VES). Solo el número.',
    config: { tools: [{ googleSearch: {} }] }
  });
  const match = response.text?.match(/\d+[.,]\d+/);
  return match ? parseFloat(match[0].replace(',', '.')) : 36.5;
};

// 7. Análisis de negocio detallado
// Added getBusinessInsights export to satisfy components/AIInsights.tsx
export const getBusinessInsights = async (products: Product[], transactions: Transaction[], rate: number) => {
  const ai = getAI();
  const prompt = `Analiza los siguientes datos de una frutería en Venezuela (Tasa: ${rate} Bs/USD):
  Productos: ${JSON.stringify(products)}
  Transacciones: ${JSON.stringify(transactions)}
  
  Genera un informe detallado que incluya:
  1. Salud financiera general.
  2. Análisis de mermas y pérdidas.
  3. Sugerencias para mejorar márgenes de ganancia.
  4. Comportamiento de ventas por moneda (USD/VES).
  Usa un tono profesional pero cercano, enfocado en el éxito del negocio.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text;
};
