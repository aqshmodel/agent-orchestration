
import { FunctionDeclaration, Type } from '@google/genai';

export const ORCHESTRATOR_TOOLS: FunctionDeclaration[] = [
  {
    name: 'invoke',
    description: '特定の専門エージェントを呼び出し、タスクを依頼する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        agent_alias: { type: Type.STRING, description: 'エージェントのエイリアス' },
        query: { type: Type.STRING, description: 'エージェントへの指示' },
      },
      required: ['agent_alias', 'query'],
    },
  },
  {
    name: 'invoke_parallel',
    description: '複数の専門エージェントを同時に呼び出し、タスクを依頼する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        invocations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              agent_alias: { type: Type.STRING },
              query: { type: Type.STRING },
            },
            required: ['agent_alias', 'query'],
          },
        },
      },
      required: ['invocations'],
    },
  },
    {
    name: 'consult',
    description: 'あるエージェントが別のエージェントに質問する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        from_alias: { type: Type.STRING, description: '相談元のエイリアス' },
        to_alias: { type: Type.STRING, description: '相談先のエイリアス' },
        query: { type: Type.STRING, description: '相談内容' },
      },
      required: ['from_alias', 'to_alias', 'query'],
    },
  },
  {
    name: 'add_member',
    description: 'チームに新たな専門エージェントを追加する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        agent_alias: { type: Type.STRING, description: '追加するエージェントのエイリアス' },
        reason: { type: Type.STRING, description: '追加理由' },
      },
      required: ['agent_alias', 'reason'],
    },
  },
  {
    name: 'review',
    description: 'あるエージェント(reviewer)に別のエージェント(target)の報告書をレビューさせる。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reviewer_alias: { type: Type.STRING, description: 'レビューを行うエージェント（レビュアー）のエイリアス' },
        target_alias: { type: Type.STRING, description: 'レビュー対象となる報告書を書いたエージェントのエイリアス' },
        query: { type: Type.STRING, description: 'レビュー指示' },
      },
      required: ['reviewer_alias', 'target_alias', 'query'],
    },
  },
  {
    name: 'ask_human',
    description: '人間に質問する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        question: { type: Type.STRING, description: '質問内容' },
      },
      required: ['question'],
    },
  },
  {
    name: 'complete',
    description: 'ミッションを完了し、最終報告を提出する。',
    parameters: {
      type: Type.OBJECT,
      properties: {
        final_report: { type: Type.STRING, description: '最終報告書の内容' },
      },
      required: ['final_report'],
    },
  },
];
