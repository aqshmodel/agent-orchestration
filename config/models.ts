

export interface ModelConfig {
    model: string;
    thinkingConfig?: {
        thinkingBudget: number;
    };
    supportsMixedTools: boolean;
}

export const getModelConfig = (selection: string): ModelConfig => {
    if (selection === 'gemini-3-pro-preview-high') {
        return { model: 'gemini-3-pro-preview', thinkingConfig: { thinkingBudget: 32768 }, supportsMixedTools: true };
    }
    if (selection === 'gemini-3-pro-preview-low') {
        return { model: 'gemini-3-pro-preview', thinkingConfig: { thinkingBudget: 2048 }, supportsMixedTools: true };
    }
    if (selection === 'gemini-2.5-pro') {
        return { model: 'gemini-2.5-pro', thinkingConfig: undefined, supportsMixedTools: true };
    }
    if (selection === 'gemini-flash-latest') {
         return { model: 'gemini-flash-latest', thinkingConfig: undefined, supportsMixedTools: false };
    }
    // Default fallback
    const isFlash = selection.toLowerCase().includes('flash');
    return { model: selection, thinkingConfig: undefined, supportsMixedTools: !isFlash };
};