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
};
