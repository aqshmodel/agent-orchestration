
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
