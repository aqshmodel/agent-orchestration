
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateResponse = async (
  systemPrompt: string,
  prompt: string,
  context?: string,
  modelName: 'gemini-2.5-pro' | 'gemini-2.5-flash' = 'gemini-2.5-pro',
  useSearch: boolean = false
): Promise<string> => {
  try {
    // コンテキストが提供された場合、それをプロンプトに結合して全体像をエージェントに渡す
    const fullPrompt = context
      ? `以下は、あなたへの今回のタスク指示の前に共有された、プロジェクト全体のコンテキストログです。必ずこれを完全に理解した上で、タスクを実行してください。\n\n--- プロジェクト共有コンテキスト ---\n${context}\n\n--- 今回のあなたのタスク ---\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: fullPrompt,
      config: {
        systemInstruction: systemPrompt,
        tools: useSearch ? [{ googleSearch: {} }] : undefined,
      },
    });
    // response.text can be undefined if the response is blocked.
    // Return empty string to prevent downstream errors (e.g. .trim()).
    const text = response.text;
    return text || "";
  } catch (error) {
    console.error("Error generating response:", error);
    // エラー文字列を返すのではなく、エラーを再スローします。
    // これにより、App.tsxの呼び出し元関数がエラーを捕捉し、
    // 適切なエージェントカードにシステムメッセージを表示し、
    // 詳細なエラーをエラーログモーダルに追加することができます。
    throw error;
  }
};
