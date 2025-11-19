
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

export const AGENT_PROMPTS: Record<string, string> = {
  president: PRESIDENT_PROMPT,
  orchestrator: ORCHESTRATOR_PROMPT,
  A1: A1_PROMPT + COMMON_POSTAMBLE,
  A2: A2_PROMPT + COMMON_POSTAMBLE,
  A3: A3_PROMPT + COMMON_POSTAMBLE,
  A4: A4_PROMPT + COMMON_POSTAMBLE,
  A5: A5_PROMPT + COMMON_POSTAMBLE,
  A6: A6_PROMPT + COMMON_POSTAMBLE,
  A7: A7_PROMPT + COMMON_POSTAMBLE,
  A8: A8_PROMPT + COMMON_POSTAMBLE,
  A9: A9_PROMPT + COMMON_POSTAMBLE,
  A10: A10_PROMPT + COMMON_POSTAMBLE,
  A11: A11_PROMPT + COMMON_POSTAMBLE,
  A12: A12_PROMPT + COMMON_POSTAMBLE,
  A13: A13_PROMPT + COMMON_POSTAMBLE,
  A14: A14_PROMPT + COMMON_POSTAMBLE,
  A15: A15_PROMPT + COMMON_POSTAMBLE,
  A16: A16_PROMPT + COMMON_POSTAMBLE,
  A17: A17_PROMPT + COMMON_POSTAMBLE,
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
  C4: C4_PROMPT + COMMON_POSTAMBLE,
  C5: C5_PROMPT + COMMON_POSTAMBLE,
  C6: C6_PROMPT + COMMON_POSTAMBLE,
};