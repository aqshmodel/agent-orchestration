export enum Team {
  LEADERSHIP = "リーダーシップ",
  STRATEGIC_INSIGHT = "戦略インサイトチーム",
  PRODUCT_DESIGN = "製品デザインチーム",
  TECH_DEVELOPMENT = "技術開発チーム",
  INFRA_SECURITY = "インフラ＆セキュリティチーム",
  MARKETING_BRAND = "マーケティング＆ブランドチーム",
  SALES_PARTNERSHIPS = "セールス＆パートナーシップチーム",
  COMMUNICATIONS_CUSTOMER_RELATIONS = "広報・顧客リレーションチーム",
  FINANCE_BUSINESS_STRATEGY = "財務・事業戦略チーム",
  PEOPLE_OPERATIONS = "人事・オペレーションチーム",
  LEGAL_COMPLIANCE = "法務・コンプライアンスチーム",
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
