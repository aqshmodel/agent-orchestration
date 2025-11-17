# A.G.I.S. Technical Documentation & Development Log

**Project Name:** A.G.I.S. (AI Generative Intelligence System)
**Version:** 3.0 (Based on internal prompt versioning)
**Description:** Google Gemini 2.5モデル群を活用した、自律型階層的マルチエージェント組織シミュレーションシステム。

---

## 1. アーキテクチャ概要

本アプリケーションは、React (TypeScript) をフロントエンドとし、Google Gemini APIをバックエンドの推論エンジンとして利用するクライアントサイド・アプリケーション（SPA）です。

### Tech Stack
- **Frontend Framework:** React 19.2.0
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI Model:** Google Gemini 2.5 Pro (推論・タスク実行), Gemini 2.5 Flash (高速な初期判断)
- **SDK:** `@google/genai`
- **Build/Runtime:** ES Modules (Browser Native via Import Map)

### データフロー
1.  **User Input:** ユーザーが自然言語で指示を入力。
2.  **President Phase:** プレジデントAIが指示を解釈、Google検索で文脈補完し、最適な「専門家チーム」を選抜。
3.  **Orchestration Loop:** オーケストレーターAIが選抜されたチームメンバー（エージェント）に対し、動的にタスクを割り振る（直列/並列）。
4.  **Specialist Execution:** 各専門家エージェントがタスクを実行し、結果を返す。
5.  **Review Phase:** 最終成果物をプレジデントがレビュー。修正指示（Re-instruct）または完了承認を行う。

---

## 2. エージェントシステム構造

システムは62体の定義済みエージェントで構成されており、役割に応じて厳格な階層構造を持ちます。

### 2.1. 階層構造
1.  **Leadership (上位層)**
    -   `president`: 最高意思決定者。チーム編成、初期方針策定、最終レビュー担当。
    -   `orchestrator`: プロジェクトマネージャー。タスク分解、進捗管理、品質保証、エージェント呼び出し担当。
2.  **Specialist Teams (実行層)**
    -   10チーム、計60体の専門家エージェント（Analyst, Designer, Engineer, Legal, HR等）。
    -   各エージェントは特定の役割（Role）、ペルソナ、専門知識を持ちます。

### 2.2. プロンプトエンジニアリング (`prompts/`)
-   **Genesis Document:** 全エージェントが準拠すべき憲法・哲学定義。
-   **System Prompts:** 各エージェントの役割定義。`agentPrompts.ts` で管理。
-   **Common Postamble:** 全エージェントに共通して付与される「絶対的ルール」（日本語出力強制、コンテキスト読込指示など）。

---

## 3. コア機能詳細

### 3.1. 自律オーケストレーションエンジン (`App.tsx`)
本アプリの核心となるロジックです。オーケストレーターAIが出力する特定のテキストコマンドを正規表現でパースし、アプリケーションのステートを制御します。

#### コマンドプロトコル
オーケストレーターは以下のコマンドを発行し、自律的にループします。

| コマンド | 機能 | 動作 |
| :--- | :--- | :--- |
| `AGIS_CMD::invoke(alias, "query")` | 単一実行 | 指定されたエイリアスのエージェント1体を呼び出し、タスクを実行させる。 |
| `AGIS_CMD::invoke_parallel([...])` | 並列実行 | 複数のエージェントを同時に呼び出し、並行して処理を行う（Promise.all）。 |
| `AGIS_CMD::ask_human("question")` | 人間介入 | ユーザーに対して質問を行い、処理を一時停止する。ユーザー回答後に再開。 |
| `AGIS_CMD::complete("report")` | 完了報告 | 成果物をまとめ、プレジデントにレビューを依頼する。 |

### 3.2. プレジデントの意思決定ロジック
-   **チーム編成:** ユーザー入力に対し、`AGIS_TEAM::[agent_alias_list]` という形式で必要なエージェントのみを選抜します。
-   **レビューと差し戻し:** 最終成果物に対し、品質基準を満たさない場合 `REINSTRUCT::` コマンドを発行し、オーケストレーションループを再起動させます。

### 3.3. コンテキスト管理
-   **Conversation History:** プレジデント、オーケストレーター、各エージェントの対話ログは `conversationHistoryRef` に蓄積されます。
-   **Token Efficiency:** オーケストレーターは全ログを参照しますが、各スペシャリストを呼び出す際は、必要なコンテキストのみを要約して渡すよう指示されています（プロンプトレベルでの制御）。

### 3.4. UI/UX機能
-   **Agent Card:** 各エージェントの状態（待機中、思考中、完了）をカード形式で表示。
-   **Dynamic Scrolling:** 思考中のエージェントへ自動スクロール。
-   **Thinking Animation:** 処理中のエージェントカードのボーダーアニメーション。
-   **Markdown Rendering:** エージェントからの回答（リスト、コードブロック）を整形表示。
-   **Error Logging:** APIエラー等をローカルストレージに保存し、モーダルで閲覧可能。
-   **Result Download:** 最終レポートをMarkdownファイルとしてダウンロード可能。

---

## 4. ファイル構造と責務

```text
/
├── index.html              # エントリーポイント、Tailwind CDN、Import Map
├── index.tsx               # Reactマウント
├── App.tsx                 # メインロジック（ステート管理、オーケストレーションループ）
├── types.ts                # 型定義 (Agent, Message, Team)
├── constants.ts            # エージェント定義マスタ (AGENTS), チームカラー設定
├── services/
│   └── geminiService.ts    # Gemini API ラッパー (generateContent)
├── components/
│   ├── AgentCard.tsx       # エージェントUI、Markdown表示
│   ├── UserInput.tsx       # ユーザー入力フォーム
│   ├── Toast.tsx           # 通知コンポーネント
│   ├── QuestionModal.tsx   # 人間介入用モーダル
│   └── ErrorLogModal.tsx   # エラーログ表示
└── prompts/
    ├── genesisDocument.ts  # 共通憲法
    ├── common.ts           # 共通プロンプト末尾
    ├── agentPrompts.ts     # プロンプト集約ファイル
    └── agents/             # 各エージェントの個別プロンプトファイル (62ファイル)
```

## 5. 今後の開発・改善ポイント (TODO)

1.  **ストリーミング対応:** 現在は `generateContent` を使用しているため、回答が完了するまで表示されません。`generateContentStream` への移行によりUX向上が見込めます。
2.  **トークン制限対策:** 長期的な対話においてコンテキストウィンドウ制限に達する可能性があります。要約機能の実装や、過去ログの切り捨てロジックが必要です。
3.  **ツール使用の拡充:** 現在はGoogle Searchのみですが、Code Executionなどのツール連携により、エージェントの実務能力（計算、グラフ描画）を強化可能です。
4.  **並列処理のUI改善:** `invoke_parallel` 実行時、複数のエージェントが同時に思考中になる様子をより視覚的に分かりやすく表現する余地があります。

---
*End of Document*
