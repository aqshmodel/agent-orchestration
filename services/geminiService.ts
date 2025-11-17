
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

const buildContents = (prompt: string, context?: string, imageBase64?: string) => {
  const fullPrompt = context
    ? `以下は、あなたへの今回のタスク指示の前に共有された、プロジェクト全体のコンテキストログです。必ずこれを完全に理解した上で、タスクを実行してください。\n\n--- プロジェクト共有コンテキスト ---\n${context}\n\n--- 今回のあなたのタスク ---\n${prompt}`
    : prompt;

  const parts: Part[] = [];
  
  if (imageBase64) {
    // Extract mimeType and data from base64 string (e.g., "data:image/png;base64,ABC...")
    const match = imageBase64.match(/^data:(.+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  parts.push({ text: fullPrompt });

  return parts;
};

export const generateResponse = async (
  systemPrompt: string,
  prompt: string,
  context?: string,
  modelName: 'gemini-2.5-pro' | 'gemini-2.5-flash' = 'gemini-2.5-pro',
  useSearch: boolean = false,
  imageBase64?: string
): Promise<string> => {
  try {
    const contents = buildContents(prompt, context, imageBase64);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: contents }, // Correct structure for @google/genai
      config: {
        systemInstruction: systemPrompt,
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
      },
    });
    const text = response.text;
    return text || "";
  } catch (error) {
    console.error("Error generating response:", error);
    throw error;
  }
};

export const generateResponseStream = async (
  systemPrompt: string,
  prompt: string,
  onChunk: (text: string) => void,
  context?: string,
  modelName: 'gemini-2.5-pro' | 'gemini-2.5-flash' = 'gemini-2.5-pro',
  useSearch: boolean = false,
  imageBase64?: string
): Promise<string> => {
  try {
    const contents = buildContents(prompt, context, imageBase64);

    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: { parts: contents },
      config: {
        systemInstruction: systemPrompt,
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
      },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Error generating response stream:", error);
    throw error;
  }
};
