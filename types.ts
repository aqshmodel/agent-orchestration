export enum Team {
  LEADERSHIP = "リーダーシップ",
  INSIGHT = "インサイト",
  CREATIVE = "クリエイティブ",
  REALITY_GROWTH = "リアリティ＆グロース",
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
