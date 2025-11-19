
import { GoogleGenAI, FunctionDeclaration, Tool, FunctionCall, Part, Modality } from "@google/genai";
import { translations } from "../locales/translations";
import { Artifact } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper type for our internal processing
export interface UploadedFile {
    name: string;
    type: string;
    data: string; // Base64
    isText: boolean;
}

// エラータイプの定義
export enum GeminiErrorType {
  RATE_LIMIT = 'RATE_LIMIT', // 429
  SERVER_ERROR = 'SERVER_ERROR', // 500, 503
  AUTH_ERROR = 'AUTH_ERROR', // 401, 403
  INVALID_REQUEST = 'INVALID_REQUEST', // 400
  UNKNOWN = 'UNKNOWN'
}

export class GeminiError extends Error {
  type: GeminiErrorType;
  originalError: any;

  constructor(type: GeminiErrorType, message: string, originalError: any) {
    super(message);
    this.type = type;
    this.originalError = originalError;
  }
}

const classifyError = (error: any): GeminiError => {
  const msg = error.message || String(error);
  let type = GeminiErrorType.UNKNOWN;

  if (msg.includes('429') || msg.includes('Resource has been exhausted')) {
    type = GeminiErrorType.RATE_LIMIT;
  } else if (msg.includes('500') || msg.includes('503') || msg.includes('Internal has occurred') || msg.includes('fetch failed')) {
    type = GeminiErrorType.SERVER_ERROR;
  } else if (msg.includes('401') || msg.includes('403') || msg.includes('API key not valid')) {
    type = GeminiErrorType.AUTH_ERROR;
  } else if (msg.includes('400') || msg.includes('INVALID_ARGUMENT')) {
    type = GeminiErrorType.INVALID_REQUEST;
  }

  return new GeminiError(type, msg, error);
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T>(operation: () => Promise<T>, maxRetries: number = 3, initialDelay: number = 1000): Promise<T> => {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      const classifiedError = classifyError(error);
      
      // Retry on Rate Limit or Server Error
      if (classifiedError.type === GeminiErrorType.RATE_LIMIT || classifiedError.type === GeminiErrorType.SERVER_ERROR) {
        const delay = initialDelay * Math.pow(2, i); // Exponential backoff
        console.warn(`API call failed (Attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`, classifiedError.message);
        await wait(delay);
        continue;
      }
      
      // Do not retry for Auth errors or Invalid requests
      throw classifiedError;
    }
  }
  throw classifyError(lastError);
};

const buildContents = (prompt: string, context?: string, knowledgeBase?: string, files?: UploadedFile[], language: 'ja' | 'en' = 'ja') => {
  let fullPrompt = '';
  const t = translations[language].context;

  if (knowledgeBase) {
    fullPrompt += `${t.knowledgeBaseHeader}\n${knowledgeBase}\n\n---\n\n`;
  }
  
  if (context) {
    fullPrompt += `\n${t.contextLogHeader}\n${context}\n\n`;
  }
  
  // Handle Text Files as Context
  if (files && files.length > 0) {
      const textFiles = files.filter(f => f.isText);
      if (textFiles.length > 0) {
          fullPrompt += `\n${t.ragHeader}\n`;
          textFiles.forEach(f => {
              fullPrompt += `\n${t.fileName.replace('{name}', f.name)}\n${f.data}\n`;
          });
          fullPrompt += `\n----------------------------\n`;
      }
  }

  fullPrompt += prompt;

  const parts: Part[] = [];
  
  // Handle Binary Files (Images, PDFs, Audio) as Inline Data
  if (files && files.length > 0) {
      const binaryFiles = files.filter(f => !f.isText);
      binaryFiles.forEach(f => {
          const mimeType = f.type;
          // Extract base64 data (remove data:image/png;base64, prefix)
          const base64Data = f.data.split(',')[1];
          if (base64Data) {
               parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
          }
      });
  }

  parts.push({ text: fullPrompt });

  return parts;
};

export type StreamResponseResult = {
    text: string;
    functionCalls: FunctionCall[];
    artifacts: Artifact[];
};

// Generate Image using Gemini 2.5 Flash Image (nano banana)
export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '4:3' | '3:4' | '9:16' = '1:1'): Promise<Artifact | null> => {
    try {
        // Gemini 2.5 Flash Image handles aspect ratio and style via text prompt
        const enhancedPrompt = `${prompt}, aspect ratio ${aspectRatio}, high quality, photorealistic, clear details`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { text: enhancedPrompt }
                ]
            },
            config: {
                responseModalities: [Modality.IMAGE],
            }
        });

        if (response.candidates && response.candidates.length > 0) {
            const parts = response.candidates[0].content.parts;
            for (const part of parts) {
                if (part.inlineData) {
                    const artifact: Artifact = {
                        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        type: 'image',
                        mimeType: part.inlineData.mimeType,
                        data: part.inlineData.data,
                        description: prompt, // Use original prompt as description
                        agentId: 'system',
                        timestamp: Date.now()
                    };
                    return artifact;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Image generation failed:", error);
        return null;
    }
};

// Helper to fix broken Mermaid code
export const fixMermaidCode = async (code: string, errorMessage: string): Promise<string | null> => {
    try {
        const prompt = `
Fix the following Mermaid diagram code which caused a syntax error.
Return ONLY the corrected Mermaid code enclosed in a markdown code block (e.g., \`\`\`mermaid ... \`\`\`).
Do not add any explanation.

Error Message:
${errorMessage}

Broken Code:
${code}
`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'text/plain',
            }
        });
        
        const text = response.text;
        if (!text) return null;
        
        // Extract code from markdown block if present
        const match = text.match(/```(?:mermaid)?\n([\s\S]*?)```/);
        return match ? match[1].trim() : text.trim();
        
    } catch (e) {
        console.error("Failed to fix mermaid code:", e);
        return null;
    }
};

export const generateResponseStream = async (
  systemPrompt: string,
  prompt: string,
  onChunk: (text: string) => void,
  context?: string,
  knowledgeBase?: string,
  modelName: string = 'gemini-3-pro-preview',
  useSearch: boolean = false,
  files?: UploadedFile[],
  tools?: FunctionDeclaration[],
  thinkingConfig?: { thinkingBudget?: number, includeThoughts?: boolean },
  language: 'ja' | 'en' = 'ja',
  agentId: string = 'unknown' // To tag artifacts
): Promise<StreamResponseResult> => {
  try {
    const contents = buildContents(prompt, context, knowledgeBase, files, language);
    
    const configTools: Tool[] = [];
    
    if (useSearch) {
        configTools.push({ googleSearch: {} });
    }
    
    // Enable Code Execution for Gemini Models
    configTools.push({ codeExecution: {} });
    
    if (tools && tools.length > 0) {
        configTools.push({ functionDeclarations: tools });
    }

    // Config setup
    const config: any = {
      systemInstruction: systemPrompt,
      tools: configTools.length > 0 ? configTools : undefined,
    };
    
    // Apply thinking config if provided
    if (thinkingConfig) {
        config.thinkingConfig = thinkingConfig;
    }

    // Wrap the API call with retry logic
    const responseStream = await retryOperation(async () => {
        return await ai.models.generateContentStream({
          model: modelName,
          contents: { parts: contents },
          config: config,
        });
    });

    let fullText = "";
    const functionCalls: FunctionCall[] = [];
    const artifacts: Artifact[] = [];

    for await (const chunk of responseStream) {
      if (chunk.candidates) {
        for (const candidate of chunk.candidates) {
          if (candidate.content && candidate.content.parts) {
            for (const part of candidate.content.parts) {
              // Text Output
              if (part.text) {
                fullText += part.text;
                onChunk(fullText);
              }
              // Code Execution: The Code
              if (part.executableCode) {
                  const codeBlock = `\n\`\`\`python\n${part.executableCode.code}\n\`\`\`\n`;
                  fullText += codeBlock;
                  onChunk(fullText);
              }
              // Code Execution: The Result
              if (part.codeExecutionResult) {
                   const outcome = part.codeExecutionResult.outcome; // OUTCOME_OK, etc.
                   const output = part.codeExecutionResult.output || "";
                   let resultBlock = `\n\`\`\`text\n[Execution Result: ${outcome}]\n${output}\n\`\`\`\n`;
                   fullText += resultBlock;
                   onChunk(fullText);
              }
              // Code Execution: Generated Images (Matplotlib etc)
              if (part.inlineData) {
                  const mimeType = part.inlineData.mimeType;
                  const data = part.inlineData.data;
                  if (mimeType.startsWith('image/')) {
                      const artifactId = `fig_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
                      const description = "Generated Figure";
                      
                      // Store artifact
                      artifacts.push({
                          id: artifactId,
                          type: 'image',
                          mimeType: mimeType,
                          data: data,
                          description: description,
                          agentId: agentId,
                          timestamp: Date.now()
                      });

                      // Inject Reference Tag instead of raw image
                      const referenceTag = `\n<FIGURE ID="${artifactId}" DESC="${description}" />\n`;
                      fullText += referenceTag;
                      onChunk(fullText);
                  }
              }
              
              // Function Call
              if (part.functionCall) {
                functionCalls.push(part.functionCall);
              }
            }
          }
        }
      }
    }
    
    return { text: fullText, functionCalls, artifacts };

  } catch (error) {
    console.error("Error generating response stream:", error);
    throw classifyError(error);
  }
};
