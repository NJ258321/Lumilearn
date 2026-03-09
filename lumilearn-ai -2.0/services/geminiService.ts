import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to check if API key is present (mock check for UI)
export const hasApiKey = (): boolean => !!apiKey;

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are an intelligent AI tutor for university students. 
      Your name is "Lumi". 
      Your goal is to help students review efficiently, explain complex concepts simply, and identify knowledge gaps.
      Keep responses concise, encouraging, and structured.
      If asked about a specific study plan, suggest a "Time Machine" review session for weak points.`,
    },
  });
};

export const sendMessage = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "Sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the knowledge base right now. Please check your network or API key.";
  }
};

export const generateDailyPlan = async (currentTasks: any[]): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these current tasks: ${JSON.stringify(currentTasks)}, 
      generate a motivational short sentence and a suggested optimization for the user's daily plan. 
      Format: JSON with keys "motivation" and "optimization".`,
      config: {
        responseMimeType: 'application/json'
      }
    });
    return response.text || "{}";
  } catch (error) {
    console.error(error);
    return "{}";
  }
};
