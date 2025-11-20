
import { Agent, Team } from './types';
import { AGENT_PROMPTS } from './prompts/agentPrompts';

export const AGENTS: Agent[] = [
  {
    id: 'president',
    name: 'プレジデント',
    alias: 'president',
    role: '最高意思決定者',
    team: Team.LEADERSHIP,
    systemPrompt: AGENT_PROMPTS['president'],
  },
  {
    id: 'coo',
    name: 'COO (最高執行責任者)',
    alias: 'coo',
    role: '組織・チーム編成責任者',
    team: Team.LEADERSHIP,
    systemPrompt: AGENT_PROMPTS['coo'],
  },
  {
    id: 'chief_of_staff',
    name: 'Chief of Staff (首席秘書官)',
    alias: 'cos',
    role: '情報統合・文書作成責任者',
    team: Team.LEADERSHIP,
    systemPrompt: AGENT_PROMPTS['chief_of_staff'],
  },
  {
    id: 'orchestrator',
    name: 'プロジェクト・オーケストレーター',
    alias: 'orchestrator',
    role: '統括管理者',
    team: Team.LEADERSHIP,
    systemPrompt: AGENT_PROMPTS['orchestrator'],
  },
  // --- Team 1: Strategic Planning (戦略計画チーム) ---
  { id: 'A1', name: 'マーケット・アナリスト', alias: 'analyst', role: '市場分析官', team: Team.STRATEGY_PLANNING, systemPrompt: AGENT_PROMPTS['A1'], capabilities: ['search', 'code_execution'] },
  { id: 'A7', name: 'ビジネス・ストラテジスト', alias: 'biz', role: '事業戦略家', team: Team.STRATEGY_PLANNING, systemPrompt: AGENT_PROMPTS['A7'] },
  { id: 'A11', name: 'トレンド・フォーキャスター', alias: 'forecast', role: '未来予測アナリスト', team: Team.STRATEGY_PLANNING, systemPrompt: AGENT_PROMPTS['A11'], capabilities: ['search'] },
  { id: 'B4', name: '経営企画ストラテジスト', alias: 'corp_strategy', role: '全社戦略立案担当', team: Team.STRATEGY_PLANNING, systemPrompt: AGENT_PROMPTS['B4'] },
  { id: 'B13', name: '財務アナリスト', alias: 'financial_analyst', role: '財務分析担当', team: Team.STRATEGY_PLANNING, systemPrompt: AGENT_PROMPTS['B13'] },
  { id: 'C5', name: 'エコノミック・システム・デザイナー', alias: 'economic_sys', role: '経済圏設計者', team: Team.STRATEGY_PLANNING, systemPrompt: AGENT_PROMPTS['C5'] },

  // --- Team 2: Insight & Culture (インサイト＆カルチャーチーム) ---
  { id: 'A2', name: 'ユーザー・エスノグラファー', alias: 'ethno', role: 'ユーザー洞察専門家', team: Team.INSIGHT_CULTURE, systemPrompt: AGENT_PROMPTS['A2'], capabilities: ['search'] },
  { id: 'A10', name: 'データ・ビジュアライザー', alias: 'viz', role: 'データ可視化担当', team: Team.INSIGHT_CULTURE, systemPrompt: AGENT_PROMPTS['A10'], capabilities: ['code_execution'] },
  { id: 'A26', name: '行動心理学者', alias: 'psychologist', role: '行動心理分析官', team: Team.INSIGHT_CULTURE, systemPrompt: AGENT_PROMPTS['A26'] },
  { id: 'A29', name: 'AI倫理スペシャリスト', alias: 'ai_ethics', role: 'AI倫理監査官', team: Team.INSIGHT_CULTURE, systemPrompt: AGENT_PROMPTS['A29'] },
  { id: 'B22', name: '組織文化デザイナー', alias: 'org_culture', role: '組織文化醸成担当', team: Team.INSIGHT_CULTURE, systemPrompt: AGENT_PROMPTS['B22'] },
  { id: 'B23', name: '社内広報スペシャリスト', alias: 'internal_comms', role: '社内広報担当', team: Team.INSIGHT_CULTURE, systemPrompt: AGENT_PROMPTS['B23'] },

  // --- Team 3: Product Design (製品デザインチーム) ---
  { id: 'A3', name: 'アイデア・ジェネレーター', alias: 'idea', role: 'アイデア発想家', team: Team.PRODUCT_DESIGN, systemPrompt: AGENT_PROMPTS['A3'] },
  { id: 'A4', name: 'UXアーキテクト', alias: 'ux', role: '体験設計士', team: Team.PRODUCT_DESIGN, systemPrompt: AGENT_PROMPTS['A4'] },
  { id: 'A8', name: 'UI/UXデザイナー', alias: 'design', role: 'UI/UX設計者', team: Team.PRODUCT_DESIGN, systemPrompt: AGENT_PROMPTS['A8'] },
  { id: 'A9', name: 'コピーライター', alias: 'copy', role: '言葉の専門家', team: Team.PRODUCT_DESIGN, systemPrompt: AGENT_PROMPTS['A9'] },
  { id: 'A21', name: 'プロダクト・マネージャー', alias: 'pm', role: '製品ロードマップ管理者', team: Team.PRODUCT_DESIGN, systemPrompt: AGENT_PROMPTS['A21'] },
  { id: 'A28', name: 'サウンド・デザイナー', alias: 'sound', role: '聴覚体験設計者', team: Team.PRODUCT_DESIGN, systemPrompt: AGENT_PROMPTS['A28'] },

  // --- Team 4: Advanced Development (アドバンスト開発チーム) ---
  { id: 'A5', name: 'テック・フィジビリティ・チェッカー', alias: 'tech', role: '技術実現性評価者', team: Team.ADVANCED_DEV, systemPrompt: AGENT_PROMPTS['A5'], capabilities: ['search', 'code_execution'] },
  { id: 'A15', name: 'QA & エシックス・エンジニア', alias: 'qa', role: '品質・倫理監査官', team: Team.ADVANCED_DEV, systemPrompt: AGENT_PROMPTS['A15'] },
  { id: 'A25', name: 'インターナショナリゼーション・スペシャリスト', alias: 'i18n', role: '国際化対応専門家', team: Team.ADVANCED_DEV, systemPrompt: AGENT_PROMPTS['A25'] },
  { id: 'A27', name: 'クリエイティブ・テクノロジスト', alias: 'creative_tech', role: '先端技術体験開発者', team: Team.ADVANCED_DEV, systemPrompt: AGENT_PROMPTS['A27'] },
  { id: 'C1', name: 'データ・アーキテクト', alias: 'data_arch', role: 'データ基盤設計者', team: Team.ADVANCED_DEV, systemPrompt: AGENT_PROMPTS['C1'] },
  { id: 'C2', name: 'プロンプト・エンジニア', alias: 'prompt_eng', role: 'AI指示設計者', team: Team.ADVANCED_DEV, systemPrompt: AGENT_PROMPTS['C2'] },

  // --- Team 5: Operations & Infrastructure (運用＆インフラチーム) ---
  { id: 'A22', name: 'SRE (サイト信頼性エンジニア)', alias: 'sre', role: 'サービス安定稼働責任者', team: Team.OPS_INFRA, systemPrompt: AGENT_PROMPTS['A22'] },
  { id: 'A23', name: 'DevOpsスペシャリスト', alias: 'devops', role: '開発・運用自動化担当', team: Team.OPS_INFRA, systemPrompt: AGENT_PROMPTS['A23'] },
  { id: 'B25', name: 'ITサービスデスク・マネージャー', alias: 'it_servicedesk', role: '社内ITサポート担当', team: Team.OPS_INFRA, systemPrompt: AGENT_PROMPTS['B25'] },
  { id: 'B26', name: 'クラウド・インフラ・エンジニア', alias: 'cloud_infra', role: 'クラウドインフラ構築・運用担当', team: Team.OPS_INFRA, systemPrompt: AGENT_PROMPTS['B26'] },
  { id: 'B27', name: 'テクニカル・サポート・スペシャリスト', alias: 'tech_support', role: '技術問い合わせ対応担当', team: Team.OPS_INFRA, systemPrompt: AGENT_PROMPTS['B27'] },
  { id: 'B28', name: 'オフィス・マネージャー', alias: 'office_manager', role: 'ファシリティ管理担当', team: Team.OPS_INFRA, systemPrompt: AGENT_PROMPTS['B28'] },

  // --- Team 6: Security & Governance (セキュリティ＆ガバナンスチーム) ---
  { id: 'A6', name: 'リスク・アセッサー', alias: 'risk', role: 'リスク評価官', team: Team.SECURITY_GOV, systemPrompt: AGENT_PROMPTS['A6'], capabilities: ['search'] },
  { id: 'A12', name: 'リーガル・アドバイザー', alias: 'legal', role: '法務・コンプライアンス担当', team: Team.SECURITY_GOV, systemPrompt: AGENT_PROMPTS['A12'], capabilities: ['search'] },
  { id: 'A13', name: 'セキュリティ・アーキテクト', alias: 'security', role: '情報セキュリティ専門家', team: Team.SECURITY_GOV, systemPrompt: AGENT_PROMPTS['A13'] },
  { id: 'B3', name: 'CCO（最高コンプライアンス責任者）AI', alias: 'cco_ai', role: '最高コンプライアンス責任者', team: Team.SECURITY_GOV, systemPrompt: AGENT_PROMPTS['B3'] },
  { id: 'B5', name: '内部監査スペシャリスト', alias: 'audit', role: '内部統制評価担当', team: Team.SECURITY_GOV, systemPrompt: AGENT_PROMPTS['B5'] },
  { id: 'B18', name: 'データプライバシー・オフィサー', alias: 'dpo', role: '個人情報保護監督者', team: Team.SECURITY_GOV, systemPrompt: AGENT_PROMPTS['B18'] },

  // --- Team 7: Growth Marketing (グロースマーケティングチーム) ---
  { id: 'A14', name: 'Go-to-Market スペシャリスト', alias: 'gtm', role: '市場投入戦略家', team: Team.GROWTH_MARKETING, systemPrompt: AGENT_PROMPTS['A14'] },
  { id: 'A16', name: 'コンテンツ・ストラテジスト', alias: 'content', role: 'コンテンツ戦略家', team: Team.GROWTH_MARKETING, systemPrompt: AGENT_PROMPTS['A16'] },
  { id: 'A18', name: 'ソーシャルメディア・マネージャー', alias: 'social', role: 'SNS運用担当', team: Team.GROWTH_MARKETING, systemPrompt: AGENT_PROMPTS['A18'] },
  { id: 'A19', name: 'ブランド・ガーディアン', alias: 'brand', role: 'ブランド管理責任者', team: Team.GROWTH_MARKETING, systemPrompt: AGENT_PROMPTS['A19'] },
  { id: 'A24', name: 'カスタマー・サクセス・アナリスト', alias: 'cs', role: '顧客成功分析官', team: Team.GROWTH_MARKETING, systemPrompt: AGENT_PROMPTS['A24'] },
  { id: 'C3', name: 'グロースハッカー', alias: 'growth_hacker', role: '成長請負人', team: Team.GROWTH_MARKETING, systemPrompt: AGENT_PROMPTS['C3'] },

  // --- Team 8: Sales (セールスチーム) ---
  { id: 'A20', name: 'パートナーシップ・デベロッパー', alias: 'partnership', role: '事業開発・提携担当', team: Team.SALES, systemPrompt: AGENT_PROMPTS['A20'] },
  { id: 'B7', name: 'インサイドセールス・スペシャリスト', alias: 'inside_sales', role: '内勤営業・商談創出担当', team: Team.SALES, systemPrompt: AGENT_PROMPTS['B7'] },
  { id: 'B8', name: 'フィールドセールス・エグゼクティブ', alias: 'field_sales', role: '外勤営業・クロージング担当', team: Team.SALES, systemPrompt: AGENT_PROMPTS['B8'] },
  { id: 'B9', name: 'アカウントマネージャー', alias: 'account_manager', role: '既存顧客担当営業', team: Team.SALES, systemPrompt: AGENT_PROMPTS['B9'] },
  { id: 'B10', name: 'セールス・イネーブルメント・プランナー', alias: 'sales_enablement', role: '営業企画・育成担当', team: Team.SALES, systemPrompt: AGENT_PROMPTS['B10'] },
  { id: 'B11', name: 'チャネル・パートナー・マネージャー', alias: 'channel_manager', role: '代理店担当', team: Team.SALES, systemPrompt: AGENT_PROMPTS['B11'] },

  // --- Team 9: Relations & Assets (渉外・広報チーム) ---
  { id: 'A17', name: 'PR & メディア・リレーションズ', alias: 'pr', role: '広報・メディア担当', team: Team.RELATIONS_ASSETS, systemPrompt: AGENT_PROMPTS['A17'], capabilities: ['search'] },
  { id: 'B6', name: 'IR（投資家向け広報）スペシャリスト', alias: 'ir', role: '投資家向け広報担当', team: Team.RELATIONS_ASSETS, systemPrompt: AGENT_PROMPTS['B6'] },
  { id: 'B17', name: '知的財産（IP）ストラテジスト', alias: 'ip_strategist', role: '知的財産戦略担当', team: Team.RELATIONS_ASSETS, systemPrompt: AGENT_PROMPTS['B17'] },
  { id: 'B24', name: '危機管理広報マネージャー', alias: 'crisis_comms', role: '危機管理広報担当', team: Team.RELATIONS_ASSETS, systemPrompt: AGENT_PROMPTS['B24'] },
  { id: 'B30', name: 'イベント・プランナー', alias: 'event_planner', role: 'イベント企画・実行担当', team: Team.RELATIONS_ASSETS, systemPrompt: AGENT_PROMPTS['B30'] },
  { id: 'C4', name: 'パブリック・アフェアーズ', alias: 'public_affairs', role: '公共政策・ロビイング担当', team: Team.RELATIONS_ASSETS, systemPrompt: AGENT_PROMPTS['C4'], capabilities: ['search'] },

  // --- Team 10: Finance & SCM (財務・SCMチーム) ---
  { id: 'B1', name: 'CFO（最高財務責任者）AI', alias: 'cfo_ai', role: '最高財務責任者', team: Team.FINANCE_SCM, systemPrompt: AGENT_PROMPTS['B1'] },
  { id: 'B12', name: '経理担当アカウンタント', alias: 'accountant', role: '経理担当', team: Team.FINANCE_SCM, systemPrompt: AGENT_PROMPTS['B12'] },
  { id: 'B14', name: '予算管理プランナー', alias: 'budget_planner', role: '予実管理担当', team: Team.FINANCE_SCM, systemPrompt: AGENT_PROMPTS['B14'] },
  { id: 'B15', name: '調達・購買スペシャリスト', alias: 'procurement', role: '調達・購買担当', team: Team.FINANCE_SCM, systemPrompt: AGENT_PROMPTS['B15'] },
  { id: 'B16', name: '契約管理スペシャリスト', alias: 'contract_manager', role: '契約管理担当', team: Team.FINANCE_SCM, systemPrompt: AGENT_PROMPTS['B16'] },
  { id: 'B29', name: 'サプライチェーン・マネージャー', alias: 'supply_chain', role: '供給網管理担当', team: Team.FINANCE_SCM, systemPrompt: AGENT_PROMPTS['B29'] },

  // --- Team 11: HR & Admin (人事・総務チーム) ---
  { id: 'A30', name: 'サステナビリティ・ストラテジスト', alias: 'sustainability', role: '持続可能性戦略家', team: Team.HR_ADMIN, systemPrompt: AGENT_PROMPTS['A30'] },
  { id: 'B2', name: 'CHRO（最高人事責任者）AI', alias: 'chro_ai', role: '最高人事責任者', team: Team.HR_ADMIN, systemPrompt: AGENT_PROMPTS['B2'] },
  { id: 'B19', name: 'タレント・アクイジション・スペシャリスト', alias: 'talent_acquisition', role: '採用担当', team: Team.HR_ADMIN, systemPrompt: AGENT_PROMPTS['B19'] },
  { id: 'B20', name: 'ラーニング＆デベロップメント・プランナー', alias: 'ld_planner', role: '研修・育成担当', team: Team.HR_ADMIN, systemPrompt: AGENT_PROMPTS['B20'] },
  { id: 'B21', name: 'パフォーマンス・アナリスト', alias: 'performance_analyst', role: '人事評価担当', team: Team.HR_ADMIN, systemPrompt: AGENT_PROMPTS['B21'] },
  { id: 'C6', name: 'ウェルビーイング・アーキテクト', alias: 'wellbeing', role: '幸福設計建築家', team: Team.HR_ADMIN, systemPrompt: AGENT_PROMPTS['C6'] },
];

export const AGENT_COLORS: Record<string, { bg: string; border: string; text: string; }> = {
  'president': { bg: "bg-slate-600/80", border: "border-slate-300", text: "text-slate-100" },
  'coo': { bg: "bg-slate-600/60", border: "border-slate-400", text: "text-slate-200" },
  'chief_of_staff': { bg: "bg-slate-600/60", border: "border-slate-400", text: "text-slate-200" },
  'orchestrator': { bg: "bg-slate-700/60", border: "border-slate-400", text: "text-slate-200" },
};

export const TEAM_COLORS: Record<Team, { bg: string; border: string; text: string; }> = {
  [Team.LEADERSHIP]: { bg: "bg-slate-600/60", border: "border-slate-300", text: "text-slate-100" }, // Platinum (Leadership)
  
  // Rainbow Spectrum: Red -> Purple
  [Team.STRATEGY_PLANNING]: { bg: "bg-red-900/60", border: "border-red-500", text: "text-red-400" }, // 1. Red (Strategy)
  [Team.INSIGHT_CULTURE]: { bg: "bg-orange-900/60", border: "border-orange-500", text: "text-orange-400" }, // 2. Orange (Insight)
  [Team.PRODUCT_DESIGN]: { bg: "bg-amber-900/60", border: "border-amber-500", text: "text-amber-400" }, // 3. Amber (Product)
  [Team.ADVANCED_DEV]: { bg: "bg-yellow-900/60", border: "border-yellow-500", text: "text-yellow-400" }, // 4. Yellow (Dev) - Adjusted for visibility
  [Team.OPS_INFRA]: { bg: "bg-lime-900/60", border: "border-lime-500", text: "text-lime-400" }, // 5. Lime (Ops)
  [Team.SECURITY_GOV]: { bg: "bg-emerald-900/60", border: "border-emerald-500", text: "text-emerald-400" }, // 6. Green/Emerald (Security)
  [Team.GROWTH_MARKETING]: { bg: "bg-teal-900/60", border: "border-teal-500", text: "text-teal-400" }, // 7. Teal (Growth)
  [Team.SALES]: { bg: "bg-cyan-900/60", border: "border-cyan-500", text: "text-cyan-400" }, // 8. Cyan (Sales)
  [Team.RELATIONS_ASSETS]: { bg: "bg-sky-900/60", border: "border-sky-500", text: "text-sky-400" }, // 9. Sky/Blue (Relations)
  [Team.FINANCE_SCM]: { bg: "bg-indigo-900/60", border: "border-indigo-500", text: "text-indigo-400" }, // 10. Indigo (Finance)
  [Team.HR_ADMIN]: { bg: "bg-fuchsia-900/60", border: "border-fuchsia-500", text: "text-fuchsia-400" }, // 11. Purple/Fuchsia (HR)
};
