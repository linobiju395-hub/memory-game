import { GoogleGenAI, Type } from "@google/genai";
import { ThemePair } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateThemePairs = async (topic: string, count: number): Promise<ThemePair[]> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning mock data.");
    return generateMockPairs(count);
  }

  try {
    const model = 'gemini-2.5-flash';
    
    // Schema definition for strict JSON output
    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        pairs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item1: { type: Type.STRING, description: "The first item of the pair (e.g., 'France')" },
              item2: { type: Type.STRING, description: "The matching concept (e.g., 'Paris')" },
            },
            required: ["item1", "item2"],
          },
        },
      },
      required: ["pairs"],
    };

    const prompt = `
      Generate ${count} unique pairs of related concepts based on the theme: "${topic}".
      The pairs should be strictly related (e.g., Country/Capital, Character/Actor, Compound/Element).
      Keep the text short (max 3-4 words per item) so it fits on a game card.
      Ensure the pairs are distinct from each other.
    `;

    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a creative game content generator designed to create matching pairs for a memory card game.",
        temperature: 0.7,
      }
    });

    const text = result.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text) as { pairs: ThemePair[] };
    
    // Sanity check length
    if (data.pairs.length < count) {
      // Fallback if AI generates too few
      return [...data.pairs, ...generateMockPairs(count - data.pairs.length)];
    }

    return data.pairs.slice(0, count);

  } catch (error) {
    console.error("Gemini generation error:", error);
    // Fallback to mock data on error
    return generateMockPairs(count);
  }
};

const generateMockPairs = (count: number): ThemePair[] => {
  const fallback = [
    { item1: "Sun", item2: "Moon" },
    { item1: "Fire", item2: "Water" },
    { item1: "Cat", item2: "Dog" },
    { item1: "Salt", item2: "Pepper" },
    { item1: "Up", item2: "Down" },
    { item1: "Left", item2: "Right" },
    { item1: "Start", item2: "Finish" },
    { item1: "Hello", item2: "Goodbye" },
  ];
  return fallback.slice(0, count);
};