

export enum Team {
  LEADERSHIP = "リーダーシップ",
  STRATEGY_PLANNING = "戦略計画チーム",
  INSIGHT_CULTURE = "インサイト＆カルチャーチーム",
  PRODUCT_DESIGN = "製品デザインチーム",
  ADVANCED_DEV = "アドバンスト開発チーム",
  OPS_INFRA = "運用＆インフラチーム",
  SECURITY_GOV = "セキュリティ＆ガバナンスチーム",
  GROWTH_MARKETING = "グロースマーケティングチーム",
  SALES = "セールスチーム",
  RELATIONS_ASSETS = "渉外・広報チーム",
  FINANCE_SCM = "財務・SCMチーム",
  HR_ADMIN = "人事・総務チーム",
}

export interface Agent {
  id: string;
  name: string;
  alias: string;
  role: string;
  team: Team;
  systemPrompt: string;
  capabilities?: ('search' | 'code_execution')[];
}

export interface Message {
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

export interface GraphEvent {
  from: string; // alias or id
  to: string;   // alias or id
  type: 'invoke' | 'consult' | 'review' | 'add_member' | 'report' | 'instruction';
  label?: string;
  timestamp: number;
}

export interface Artifact {
  id: string;
  type: 'image' | 'file';
  mimeType: string;
  data: string; // Base64
  description?: string;
  agentId: string;
  timestamp: number;
}

export interface FileData {
  name: string;
  type: string;
  data: string; // Base64 or Text content
  isText: boolean;
}

// i18n Type Definitions
export interface TranslationResource {
  app: {
    title: string;
    subtitle: string;
    contextUsage: string;
    chars: string;
    contextHigh: string;
    modelHigh: string;
    modelLow: string;
    model25Pro: string;
    modelFlash: string;
    btnBrain: string;
    btnGraph: string;
    btnSession: string;
    btnError: string;
  };
  agentCard: {
    thinking: string;
    download: string;
    saveMd: string;
    saveHtml: string;
    saveWord: string;
    close: string;
    expand: string;
    copy: string;
    copied: string;
    preview: string;
    generatingImage: string;
    downloadImage: string;
  };
  input: {
    placeholder: string;
    send: string;
    attach: string;
    mic: string;
    listening: string;
    sessionMenu: string;
    clearHistory: string;
    clearHistoryDesc: string;
    clearBrain: string;
    clearBrainDesc: string;
    resetAll: string;
    resetAllDesc: string;
    audio: string;
    text: string;
    status_loading: string;
  };
  status: {
    orchestratorThinking: string;
    presidentThinking: string;
    cooAssembling: string;
    presidentReviewing: string;
    cosDrafting: string;
    presidentRefining: string;
    presidentReinstructing: string;
    agentsWorking: string;
    agentsReported: string;
    memberAdded: string;
    error: string;
    completed: string;
    reset: string;
    historyCleared: string;
    brainCleared: string;
    sessionSaved: string;
    sessionLoaded: string;
    sessionDeleted: string;
    saveFailed: string;
    loadFailed: string;
    deleteFailed: string;
    loopLimit: string;
  };
  modal: {
    kbTitle: string;
    kbCopy: string;
    kbCopied: string;
    kbEmpty: string;
    kbChars: string;
    kbTabInsights: string;
    kbTabImages: string;
    kbTabDiagrams: string;
    kbDownload: string;
    kbNoImages: string;
    kbNoDiagrams: string;
    kbDiagramSource: string;
    graphTitle: string;
    graphDesc: string;
    sessionTitle: string;
    sessionSaveTitle: string;
    sessionPlaceholder: string;
    sessionSaveBtn: string;
    sessionNewBtn: string;
    sessionNewConfirm: string;
    sessionListTitle: string;
    sessionEmpty: string;
    sessionDeleteConfirm: string;
    questionTitle: string;
    questionPlaceholder: string;
    questionSubmit: string;
    errorTitle: string;
    errorEmpty: string;
    errorClear: string;
    previewTitle: string;
  };
  teams: Record<string, string>; // Allow flexible team keys but generally Team enum values
  agents: Record<string, { name: string; role: string }>;
  prompts: {
    initialMessage: string;
    userRequestPrefix: string;
    presidentInstructionReceived: string;
    userAnswerReceived: string;
    reinstructReceived: string;
    orchestratorReviewRequest: string;
    presidentRefinementPrompt: string;
    presidentEvaluationPrompt: string;
    presidentDraftReviewPrompt: string;
    presidentFinalApprovalPrompt: string;
    cosDefaultInstruction: string; // Added this
    agentsReportedPrompt: string;
    memberAddedPrompt: string;
    checkCompletePrompt: string;
    evaluateSituationPrompt: string;
    taskInstruction: string;
    consultation: string;
    reviewRequest: string;
    systemInstructionOverride: string;
    orchestratorMandatoryRules: string;
  };
  context: {
    knowledgeBaseHeader: string;
    contextLogHeader: string;
    ragHeader: string;
    fileName: string;
  };
  errors: {
    mermaidRender: string;
    mermaidLib: string;
  };
}