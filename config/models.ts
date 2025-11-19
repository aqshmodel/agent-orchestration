
export interface ModelConfig {
    model: string;
    thinkingConfig?: {
        thinkingBudget: number;
    };
}

export const getModelConfig = (selection: string): ModelConfig => {
    if (selection === 'gemini-3-pro-preview-high') {
        return { model: 'gemini-3-pro-preview', thinkingConfig: { thinkingBudget: 32768 } };
    }
    if (selection === 'gemini-3-pro-preview-low') {
        return { model: 'gemini-3-pro-preview', thinkingConfig: { thinkingBudget: 2048 } };
    }
    if (selection === 'gemini-2.5-pro') {
        return { model: 'gemini-2.5-pro', thinkingConfig: undefined };
    }
    if (selection === 'gemini-flash-latest') {
         return { model: 'gemini-flash-latest', thinkingConfig: undefined };
    }
    return { model: selection, thinkingConfig: undefined };
};
