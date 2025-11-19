
import { COMMON_POSTAMBLE } from './common';
import { PRESIDENT_PROMPT } from './agents/president';
import { ORCHESTRATOR_PROMPT } from './agents/orchestrator';
import { A1_PROMPT } from './agents/A1_analyst';
import { A2_PROMPT } from './agents/A2_ethno';
import { A3_PROMPT } from './agents/A3_idea';
import { A4_PROMPT } from './agents/A4_ux';
import { A5_PROMPT } from './agents/A5_tech';
import { A6_PROMPT } from './agents/A6_risk';
import { A7_PROMPT } from './agents/A7_biz';
import { A8_PROMPT } from './agents/A8_design';
import { A9_PROMPT } from './agents/A9_copy';
import { A10_PROMPT } from './agents/A10_viz';
import { A11_PROMPT } from './agents/A11_forecast';
import { A12_PROMPT } from './agents/A12_legal';
import { A13_PROMPT } from './agents/A13_security';
import { A14_PROMPT } from './agents/A14_gtm';
import { A15_PROMPT } from './agents/A15_qa';
import { A16_PROMPT } from './agents/A16_content';
import { A17_PROMPT } from './agents/A17_pr';
import { A18_PROMPT } from './agents/A18_social';
import { A19_PROMPT } from './agents/A19_brand';
import { A20_PROMPT } from './agents/A20_partnership';
import { A21_PROMPT } from './agents/A21_pm';
import { A22_PROMPT } from './agents/A22_sre';
import { A23_PROMPT } from './agents/A23_devops';
import { A24_PROMPT } from './agents/A24_cs';
import { A25_PROMPT } from './agents/A25_i18n';
import { A26_PROMPT } from './agents/A26_psychologist';
import { A27_PROMPT } from './agents/A27_creative_tech';
import { A28_PROMPT } from './agents/A28_sound';
import { A29_PROMPT } from './agents/A29_ai_ethics';
import { A30_PROMPT } from './agents/A30_sustainability';
import { B1_PROMPT } from './agents/B1_cfo';
import { B2_PROMPT } from './agents/B2_chro';
import { B3_PROMPT } from './agents/B3_cco';
import { B4_PROMPT } from './agents/B4_strategy';
import { B5_PROMPT } from './agents/B5_audit';
import { B6_PROMPT } from './agents/B6_ir';
import { B7_PROMPT } from './agents/B7_inside_sales';
import { B8_PROMPT } from './agents/B8_field_sales';
import { B9_PROMPT } from './agents/B9_account_manager';
import { B10_PROMPT } from './agents/B10_sales_enablement';
import { B11_PROMPT } from './agents/B11_channel_manager';
import { B12_PROMPT } from './agents/B12_accountant';
import { B13_PROMPT } from './agents/B13_financial_analyst';
import { B14_PROMPT } from './agents/B14_budget_planner';
import { B15_PROMPT } from './agents/B15_procurement';
import { B16_PROMPT } from './agents/B16_contract_manager';
import { B17_PROMPT } from './agents/B17_ip_strategist';
import { B18_PROMPT } from './agents/B18_dpo';
import { B19_PROMPT } from './agents/B19_talent_acquisition';
import { B20_PROMPT } from './agents/B20_ld_planner';
import { B21_PROMPT } from './agents/B21_performance_analyst';
import { B22_PROMPT } from './agents/B22_org_culture';
import { B23_PROMPT } from './agents/B23_internal_comms';
import { B24_PROMPT } from './agents/B24_crisis_comms';
import { B25_PROMPT } from './agents/B25_it_servicedesk';
import { B26_PROMPT } from './agents/B26_cloud_infra';
import { B27_PROMPT } from './agents/B27_tech_support';
import { B28_PROMPT } from './agents/B28_office_manager';
import { B29_PROMPT } from './agents/B29_supply_chain';
import { B30_PROMPT } from './agents/B30_event_planner';
import { C1_PROMPT } from './agents/C1_data_arch';
import { C2_PROMPT } from './agents/C2_prompt_eng';
import { C3_PROMPT } from './agents/C3_growth_hacker';
import { C4_PROMPT } from './agents/C4_public_affairs';
import { C5_PROMPT } from './agents/C5_economic_sys';
import { C6_PROMPT } from './agents/C6_wellbeing';

// 検索権限を持つエージェントへの追加指示
const SEARCH_CAPABILITY_NOTE = `
\n\n**【重要: Web検索機能の運用ルール】**
あなたには「Google Search」ツールを使用する権限が付与されています。
以下の状況では、積極的に検索ツールを使用し、事実に基づいた正確な情報（Grounding）を提供してください。
1. 最新の市場データ、統計、ニュースが必要な場合。
2. 技術的な仕様、ドキュメント、価格情報を確認する必要がある場合。
3. 法規制やガイドラインの最新情報を確認する場合。
4. あなたの内部知識が古い、または不確実である可能性がある場合。

**検索を行う際は、情報の信頼性を担保するために以下の3つのルールを厳守してください:**

1. **検索クエリの開示:**
   思考プロセスまたはレポートの冒頭に、実際に使用した検索キーワード（クエリ）を明記してください。
   *例: 「検索クエリ: "生成AI 市場規模 2025 予測", "Generative AI market size forecast 2025"」*

2. **正直な報告 (Not Found Rule):**
   検索しても信頼できる情報が見つからなかった場合は、無理に回答を捏造（ハルシネーション）せず、正直に「情報が見つかりませんでした」と報告してください。その上で推測を行う場合は、それが推測であることを明確に断ってください。

3. **出典の明記:**
   レポートの末尾に必ず**「参考文献リスト」**セクションを作成し、情報の根拠となったWebサイトのURLとタイトルをリスト形式で記載してください。URLは必ずGoogle Searchツールから取得した正確なものを使用してください。
   *記述例:*
   *   **参考文献リスト:**
       *   [タイトル](https://example.com)
       *   [タイトル](https://example.org)
`;

export const AGENT_PROMPTS: Record<string, string> = {
  president: PRESIDENT_PROMPT,
  orchestrator: ORCHESTRATOR_PROMPT,
  
  // Search Enabled Agents (Tier 1 & Tier 2)
  A1: A1_PROMPT + COMMON_POSTAMBLE + SEARCH_CAPABILITY_NOTE,
  A2: A2_PROMPT + COMMON_POSTAMBLE + SEARCH_CAPABILITY_NOTE,
  A5: A5_PROMPT + COMMON_POSTAMBLE + SEARCH_CAPABILITY_NOTE,
  A6: A6_PROMPT + COMMON_POSTAMBLE + SEARCH_CAPABILITY_NOTE,
  A11: A11_PROMPT + COMMON_POSTAMBLE + SEARCH_CAPABILITY_NOTE,
  A12: A12_PROMPT + COMMON_POSTAMBLE + SEARCH_CAPABILITY_NOTE,
  A17: A17_PROMPT + COMMON_POSTAMBLE + SEARCH_CAPABILITY_NOTE,
  C4: C4_PROMPT + COMMON_POSTAMBLE + SEARCH_CAPABILITY_NOTE,

  // Standard Agents
  A3: A3_PROMPT + COMMON_POSTAMBLE,
  A4: A4_PROMPT + COMMON_POSTAMBLE,
  A7: A7_PROMPT + COMMON_POSTAMBLE,
  A8: A8_PROMPT + COMMON_POSTAMBLE,
  A9: A9_PROMPT + COMMON_POSTAMBLE,
  A10: A10_PROMPT + COMMON_POSTAMBLE,
  A13: A13_PROMPT + COMMON_POSTAMBLE,
  A14: A14_PROMPT + COMMON_POSTAMBLE,
  A15: A15_PROMPT + COMMON_POSTAMBLE,
  A16: A16_PROMPT + COMMON_POSTAMBLE,
  A18: A18_PROMPT + COMMON_POSTAMBLE,
  A19: A19_PROMPT + COMMON_POSTAMBLE,
  A20: A20_PROMPT + COMMON_POSTAMBLE,
  A21: A21_PROMPT + COMMON_POSTAMBLE,
  A22: A22_PROMPT + COMMON_POSTAMBLE,
  A23: A23_PROMPT + COMMON_POSTAMBLE,
  A24: A24_PROMPT + COMMON_POSTAMBLE,
  A25: A25_PROMPT + COMMON_POSTAMBLE,
  A26: A26_PROMPT + COMMON_POSTAMBLE,
  A27: A27_PROMPT + COMMON_POSTAMBLE,
  A28: A28_PROMPT + COMMON_POSTAMBLE,
  A29: A29_PROMPT + COMMON_POSTAMBLE,
  A30: A30_PROMPT + COMMON_POSTAMBLE,
  B1: B1_PROMPT + COMMON_POSTAMBLE,
  B2: B2_PROMPT + COMMON_POSTAMBLE,
  B3: B3_PROMPT + COMMON_POSTAMBLE,
  B4: B4_PROMPT + COMMON_POSTAMBLE,
  B5: B5_PROMPT + COMMON_POSTAMBLE,
  B6: B6_PROMPT + COMMON_POSTAMBLE,
  B7: B7_PROMPT + COMMON_POSTAMBLE,
  B8: B8_PROMPT + COMMON_POSTAMBLE,
  B9: B9_PROMPT + COMMON_POSTAMBLE,
  B10: B10_PROMPT + COMMON_POSTAMBLE,
  B11: B11_PROMPT + COMMON_POSTAMBLE,
  B12: B12_PROMPT + COMMON_POSTAMBLE,
  B13: B13_PROMPT + COMMON_POSTAMBLE,
  B14: B14_PROMPT + COMMON_POSTAMBLE,
  B15: B15_PROMPT + COMMON_POSTAMBLE,
  B16: B16_PROMPT + COMMON_POSTAMBLE,
  B17: B17_PROMPT + COMMON_POSTAMBLE,
  B18: B18_PROMPT + COMMON_POSTAMBLE,
  B19: B19_PROMPT + COMMON_POSTAMBLE,
  B20: B20_PROMPT + COMMON_POSTAMBLE,
  B21: B21_PROMPT + COMMON_POSTAMBLE,
  B22: B22_PROMPT + COMMON_POSTAMBLE,
  B23: B23_PROMPT + COMMON_POSTAMBLE,
  B24: B24_PROMPT + COMMON_POSTAMBLE,
  B25: B25_PROMPT + COMMON_POSTAMBLE,
  B26: B26_PROMPT + COMMON_POSTAMBLE,
  B27: B27_PROMPT + COMMON_POSTAMBLE,
  B28: B28_PROMPT + COMMON_POSTAMBLE,
  B29: B29_PROMPT + COMMON_POSTAMBLE,
  B30: B30_PROMPT + COMMON_POSTAMBLE,
  C1: C1_PROMPT + COMMON_POSTAMBLE,
  C2: C2_PROMPT + COMMON_POSTAMBLE,
  C3: C3_PROMPT + COMMON_POSTAMBLE,
  C5: C5_PROMPT + COMMON_POSTAMBLE,
  C6: C6_PROMPT + COMMON_POSTAMBLE,
};
