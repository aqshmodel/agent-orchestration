

import { Team, TranslationResource } from '../types';

export const en: TranslationResource = {
  app: {
    title: 'A.G.I.S.',
    subtitle: 'AI GENERATIVE INTELLIGENCE SYSTEM',
    contextUsage: 'Context Usage',
    chars: 'chars',
    contextHigh: 'High memory usage. Clearing conversation history is recommended.',
    modelHigh: 'Gemini 3.0 Pro (Reasoning)',
    modelLow: 'Gemini 3.0 Pro (Fast)',
    model25Pro: 'Gemini 2.5 Pro',
    modelFlash: 'Gemini 2.5 Flash',
    btnBrain: 'Knowledge Base',
    btnGraph: 'Org Graph',
    btnSession: 'Session',
    btnError: 'Error Log',
  },
  agentCard: {
    thinking: 'Thinking',
    download: 'Download',
    saveMd: 'Markdown (Text)',
    saveHtml: 'HTML (Web Report)',
    saveWord: 'Word (Doc)',
    close: 'Close',
    expand: 'Expand',
    copy: 'Copy',
    copied: 'Copied!',
    preview: 'Preview',
    generatingImage: 'Generating Image',
    downloadImage: 'Download Image',
  },
  input: {
    placeholder: 'Enter instructions for the President (Audio, Images, PDFs supported)...',
    send: 'Send',
    attach: 'Attach Files',
    mic: 'Mic',
    listening: 'Listening...',
    sessionMenu: 'Session Management',
    clearHistory: 'Clear History Only',
    clearHistoryDesc: 'Retains Knowledge Base, resets conversation context.',
    clearBrain: 'Clear Knowledge Base Only',
    clearBrainDesc: 'Retains conversation, resets accumulated key insights.',
    resetAll: 'Clear All (New Session)',
    resetAllDesc: 'Resets everything and starts a new session.',
    audio: 'AUDIO',
    text: 'TEXT',
    status_loading: 'Processing...',
  },
  status: {
    orchestratorThinking: 'Orchestrator is thinking... (Cycle {count})',
    presidentThinking: 'President is formulating strategy...',
    cooAssembling: 'COO is assembling the optimal team...',
    presidentReviewing: 'President is evaluating the Orchestrator\'s report...',
    cosDrafting: 'Chief of Staff (CoS) is writing the final report... (Draft {count})',
    presidentRefining: 'President is reviewing and refining the draft... (Draft {count})',
    presidentReinstructing: 'President instructed revisions. Project continued.',
    agentsWorking: '{names} are working...',
    agentsReported: 'Reports received from specialists. Consolidating information and planning next steps.',
    memberAdded: 'Member added. Proceeding with next tasks.',
    error: 'An error occurred',
    completed: 'Project Completed!',
    reset: 'Session reset',
    historyCleared: 'Conversation history cleared (Knowledge Base retained)',
    brainCleared: 'Knowledge Base cleared',
    sessionSaved: 'Session saved',
    sessionLoaded: 'Session loaded',
    sessionDeleted: 'Session deleted',
    saveFailed: 'Failed to save session',
    loadFailed: 'Failed to load session',
    deleteFailed: 'Failed to delete session',
    loopLimit: 'Autonomous thought loop limit reached (30 cycles).\n\nTask is not yet complete. Continue processing?\nType "Yes" or specific instructions to proceed.',
  },
  modal: {
    kbTitle: 'Knowledge & Asset Library',
    kbCopy: 'Copy to Clipboard',
    kbCopied: 'Copied',
    kbEmpty: 'No knowledge accumulated yet...',
    kbChars: 'Current character count',
    kbTabInsights: 'Key Insights',
    kbTabImages: 'Images & Charts',
    kbTabDiagrams: 'Diagrams (Mermaid)',
    kbDownload: 'Download',
    kbNoImages: 'No images generated yet',
    kbNoDiagrams: 'No diagrams generated yet',
    kbDiagramSource: 'Source: {agent}',

    graphTitle: 'Interactive Dependency Graph',
    graphDesc: 'Visualizing task dependencies and information flow between agents. Click a node to expand agent details.',
    
    sessionTitle: 'Project Session Manager',
    sessionSaveTitle: 'Save Current State',
    sessionPlaceholder: 'Enter project name...',
    sessionSaveBtn: 'Save',
    sessionNewBtn: 'Start New Session',
    sessionNewConfirm: 'Is your current work saved?\nUnsaved content will be lost. Start a new session?',
    sessionListTitle: 'Saved Sessions',
    sessionEmpty: 'No saved sessions',
    sessionDeleteConfirm: 'Are you sure you want to delete this session?',
    
    questionTitle: 'Question from Orchestrator',
    questionPlaceholder: 'Enter your answer...',
    questionSubmit: 'Submit Answer',
    
    errorTitle: 'Error Log',
    errorEmpty: 'No error logs.',
    errorClear: 'Clear Logs',
    previewTitle: 'Artifact Workbench (Preview)',
  },
  teams: {
    [Team.LEADERSHIP]: "Leadership",
    [Team.STRATEGY_PLANNING]: "Strategic Planning",
    [Team.INSIGHT_CULTURE]: "Insight & Culture",
    [Team.PRODUCT_DESIGN]: "Product Design",
    [Team.ADVANCED_DEV]: "Advanced Development",
    [Team.OPS_INFRA]: "Ops & Infrastructure",
    [Team.SECURITY_GOV]: "Security & Governance",
    [Team.GROWTH_MARKETING]: "Growth Marketing",
    [Team.SALES]: "Sales",
    [Team.RELATIONS_ASSETS]: "Relations & Assets",
    [Team.FINANCE_SCM]: "Finance & SCM",
    [Team.HR_ADMIN]: "HR & Admin",
  },
  agents: {
    president: { name: 'President', role: 'Chief Decision Maker' },
    coo: { name: 'COO', role: 'Chief Operating Officer' },
    chief_of_staff: { name: 'Chief of Staff', role: 'Head of Intelligence & Documentation' },
    orchestrator: { name: 'Project Orchestrator', role: 'General Manager' },
    A1: { name: 'Market Analyst', role: 'Market Intelligence Officer' },
    A7: { name: 'Business Strategist', role: 'Strategic Planner' },
    A11: { name: 'Trend Forecaster', role: 'Future Analyst' },
    B4: { name: 'Corp Strategy Planner', role: 'Corp Strategy' },
    B13: { name: 'Financial Analyst', role: 'Financial Analysis' },
    C5: { name: 'Economic System Designer', role: 'Tokenomics/Ecosystem' },
    A2: { name: 'User Ethnographer', role: 'User Insight Expert' },
    A10: { name: 'Data Visualizer', role: 'Visualization Expert' },
    A26: { name: 'Behavioral Psychologist', role: 'Behavioral Analyst' },
    A29: { name: 'AI Ethics Specialist', role: 'Ethics Auditor' },
    B22: { name: 'Culture Designer', role: 'Org Culture' },
    B23: { name: 'Internal Comms Specialist', role: 'Internal Comms' },
    A3: { name: 'Idea Generator', role: 'Ideation Expert' },
    A4: { name: 'UX Architect', role: 'Experience Architect' },
    A8: { name: 'UI/UX Designer', role: 'Interface Designer' },
    A9: { name: 'Copywriter', role: 'Verbal Identity' },
    A21: { name: 'Product Manager', role: 'Product Roadmap' },
    A28: { name: 'Sound Designer', role: 'Audio Experience' },
    A5: { name: 'Tech Feasibility Checker', role: 'Tech Evaluator' },
    A15: { name: 'QA & Ethics Engineer', role: 'Quality/Ethics Auditor' },
    A25: { name: 'L10n Specialist', role: 'Globalization Expert' },
    A27: { name: 'Creative Technologist', role: 'Prototype Engineer' },
    C1: { name: 'Data Architect', role: 'Data Infrastructure' },
    C2: { name: 'Prompt Engineer', role: 'AI Interaction Designer' },
    A22: { name: 'SRE', role: 'Site Reliability Engineer' },
    A23: { name: 'DevOps Specialist', role: 'Automation Engineer' },
    B25: { name: 'IT Service Desk Mgr', role: 'IT Support' },
    B26: { name: 'Cloud Infra Engineer', role: 'Cloud Architect' },
    B27: { name: 'Tech Support Specialist', role: 'Customer Support' },
    B28: { name: 'Office Manager', role: 'Facility Management' },
    A6: { name: 'Risk Assessor', role: 'Risk Management' },
    A12: { name: 'Legal Advisor', role: 'Legal & Compliance' },
    A13: { name: 'Security Architect', role: 'InfoSec Expert' },
    B3: { name: 'CCO (Chief Compliance Officer) AI', role: 'Chief Compliance Officer' },
    B5: { name: 'Internal Audit Specialist', role: 'Internal Audit' },
    B18: { name: 'DPO (Data Privacy Officer)', role: 'Privacy Officer' },
    A14: { name: 'GTM Specialist', role: 'Go-to-Market Strategy' },
    A16: { name: 'Content Strategist', role: 'Content Strategy' },
    A18: { name: 'Social Media Manager', role: 'SNS Management' },
    A19: { name: 'Brand Guardian', role: 'Brand Management' },
    A24: { name: 'Customer Success Analyst', role: 'CS Analysis' },
    C3: { name: 'Growth Hacker', role: 'Growth Engineer' },
    A20: { name: 'Partnership Developer', role: 'BizDev & Alliance' },
    B7: { name: 'Inside Sales Specialist', role: 'Lead Qualification' },
    B8: { name: 'Field Sales Executive', role: 'Closing Specialist' },
    B9: { name: 'Account Manager', role: 'Existing Accounts' },
    B10: { name: 'Sales Enablement Planner', role: 'Sales Planning' },
    B11: { name: 'Channel Partner Manager', role: 'Agency Management' },
    A17: { name: 'PR & Media Relations', role: 'Public Relations' },
    B6: { name: 'IR Specialist', role: 'Investor Relations' },
    B17: { name: 'IP Strategist', role: 'Intellectual Property' },
    B24: { name: 'Crisis Comms Manager', role: 'Crisis Management' },
    B30: { name: 'Event Planner', role: 'Event Management' },
    C4: { name: 'Public Affairs', role: 'Lobbying & Policy' },
    B1: { name: 'CFO (Chief Financial Officer) AI', role: 'Chief Financial Officer' },
    B12: { name: 'Accountant', role: 'Accounting' },
    B14: { name: 'Budget Planner', role: 'Budget Management' },
    B15: { name: 'Procurement Specialist', role: 'Procurement' },
    B16: { name: 'Contract Manager', role: 'Contract Management' },
    B29: { name: 'Supply Chain Manager', role: 'SCM' },
    A30: { name: 'Sustainability Strategist', role: 'ESG Strategy' },
    B2: { name: 'CHRO (Chief HR Officer) AI', role: 'Chief HR Officer' },
    B19: { name: 'Talent Acquisition Specialist', role: 'Recruiting' },
    B20: { name: 'L&D Planner', role: 'Learning & Dev' },
    B21: { name: 'Performance Analyst', role: 'HR Evaluation' },
    C6: { name: 'Wellbeing Architect', role: 'Employee Wellbeing' },
  },
  prompts: {
      initialMessage: "Welcome to A.G.I.S. I am the President.\nPlease tell me your project goals or the problem you want to solve. I will assemble the optimal team and provide a solution.",
      userRequestPrefix: "User Request: ",
      presidentInstructionReceived: "Received instructions from the President. Starting the project now.\n\nPresident's Instructions:\n",
      userAnswerReceived: "User Answer: {answer}\n\nBased on this, please resume/continue the project.",
      reinstructReceived: "Received REINSTRUCT order from the President.\n\n{reviewText}\n\nFollow the instructions and resume the task.",
      orchestratorReviewRequest: "The Orchestrator has submitted the final report.\n\n{finalReportText}\n\nPlease review this report based on the evaluation criteria and either approve it or order revisions (REINSTRUCT).",
      agentsReportedPrompt: "Received reports from agents.\n\n{combinedResults}\n\nEvaluate these and determine the next course of action.",
      memberAddedPrompt: "Member added. Based on the current team composition and situation, determine the next action (task instruction, etc.).",
      checkCompletePrompt: "If the task is complete, use the 'complete' tool. If not, instruct the next action.",
      evaluateSituationPrompt: "Evaluate the situation and determine the next action (tool call).",
      taskInstruction: "[Task Instruction]\n{query}",
      consultation: "[Consultation from {from}]\n{query}",
      reviewRequest: "[Review Request (Target: {target}'s report)]\n{query}",
      presidentRefinementPrompt: `
[Refinement Instruction]
I have reviewed the draft, but it has not yet reached the overwhelming information density and specificity required to break the "20,000-character barrier."
Do not settle for a single pass. Strengthen the following points and **completely regenerate (rewrite) the entire HTML report from scratch**:

1. **Detail:** Double the volume of each section. Add specific numbers, case studies, and step-by-step procedures instead of abstract concepts.
2. **Comprehensiveness:** Add overlooked perspectives and answers to anticipated counterarguments.
3. **Visuals:** Increase the number of placeholders for charts and diagrams to make it visually rich.

**This is a refinement process. Use the previous output as a base, but produce a "Definitive Edition" of far superior quality.**
`,
      presidentEvaluationPrompt: `
Orchestrator has submitted the following report:
"{orchestratorSummary}"

As President, evaluate if this information is sufficient to create the final strategy report.
- **If INSUFFICIENT:** Order COO to reorganize the team for re-investigation. (Output format: "REINSTRUCT:: [Detailed Instructions to COO]")
- **If SUFFICIENT:** Order Chief of Staff (CoS) to draft the final report. (Output format: "PROCEED:: [Instructions to CoS]")
`,
      presidentDraftReviewPrompt: `
Review this draft from CoS:

{draftText}

[SYSTEM ORDER: MANDATORY REJECTION]
Usage count: {currentLoop}
You MUST NOT approve this draft yet. Find at least 3 specific areas for improvement (e.g. lack of specific numbers, weak logic, boring design). 
Output format MUST start with "REINSTRUCT::" followed by harsh but constructive feedback.
`,
      presidentFinalApprovalPrompt: `
Review this draft from CoS:

{draftText}

[SYSTEM ORDER: FINAL JUDGMENT]
This is the final iteration. If the quality is high, approve it. Output "APPROVE::" to finish.
`,
      cosDefaultInstruction: "Create the final report.",
      systemInstructionOverride: "\n\n[IMPORTANT: LANGUAGE OVERRIDE]\nThe user has selected ENGLISH mode. Regardless of the fact that your original instructions are in Japanese, you MUST think, act, and generate ALL outputs, reports, and responses in ENGLISH.\n**This includes ALL text within graphs, charts (Mermaid), and Python plots.**\n\n**[MANDATORY FORMATTING]**\nYou MUST conclude your report with a section titled '**Key Insights**' containing bullet points of critical findings, followed by a section titled '**Proposals to Orchestrator**'. Use these EXACT headers.",
      orchestratorMandatoryRules: `
[IMPORTANT: BEHAVIORAL RULES]
1. **Reveal Thought Process (Mandatory):** You MUST output your "Thought Process" in text to the user, explaining the current situation analysis, the next move, and the reason for it.
   - Explicitly state your flow of thought, e.g., "I need to consider...", "Next, I will invoke...".
2. **Use Tools:** Actions (invoking agents, completing tasks, etc.) MUST be performed using the provided tools (Function Calling).
3. **Format:**
   - (1) Describe your thought process in text.
   - (2) Call the tool.
   - **PROHIBITED:** Do NOT output command strings like 'Action: AGIS_CMD::...' as text. You MUST use the Tool.

Example:
"I have determined that market analysis is necessary. I will invoke the Analyst." -> [Tool: invoke(analyst, ...)]
`
  },
  context: {
      knowledgeBaseHeader: "--- Shared Knowledge Base (Key Insights) ---",
      contextLogHeader: "--- Project Shared Context ---",
      ragHeader: "--- Attached Documents (RAG Context) ---",
      fileName: "[File Name: {name}]",
  },
  errors: {
      mermaidRender: "Failed to render chart: ",
      mermaidLib: "Mermaid library not loaded",
  }
};