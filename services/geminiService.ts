
import { GoogleGenAI } from "@google/genai";
import { EditRequest } from "../types";

export const editImageWithGemini = async (request: EditRequest): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  // Basic prompt enhancement for product photos
  const enhancedPrompt = `
    You are an expert product photo editor. 
    User instruction: ${request.instruction}
    Please modify the provided image according to the instruction while maintaining high-quality resolution and professional studio aesthetics.
    If the user asks to remove background, ensure a clean professional cutout.
  `.trim();

  const imagePart = {
    inlineData: {
      data: request.image.split(',')[1], // Strip the data:image/png;base64, prefix
      mimeType: request.mimeType,
    },
  };

  const textPart = {
    text: enhancedPrompt
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("No image was generated. Please try a different instruction.");
    }

    // Iterate to find the image part as per Gemini guidelines
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("AI responded but no image data was found in the response.");
  } catch (error: any) {
    console.error("Gemini Edit Error:", error);
    throw new Error(error.message || "Failed to process image. Ensure your API key is valid.");
  }
};
