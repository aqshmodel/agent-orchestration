
# A.G.I.S. - AI Generative Intelligence System

**A.G.I.S. (AI Generative Intelligence System)** は、Google Gemini API (Gemini 3.0 Pro / 2.5 Pro / Flash) を活用した、自律型階層的マルチエージェント組織シミュレーションシステムです。

1人の「プレジデントAI」と60人の「専門家エージェント」が連携し、ユーザーの複雑な課題に対して、戦略立案から実行計画、成果物作成までを自律的に行います。

---

## 🚀 主な機能 (Key Features)

*   **自律的な組織運営:** プレジデントがユーザーの意図を解釈し、最適な専門家チームを動的に編成します。
*   **オーケストレーション:** オーケストレーターAIがタスクを分解し、並列実行、メンバー追加、相互レビューなどのツールを駆使してプロジェクトを推進します。
*   **多様な専門家エージェント:** 戦略、マーケティング、開発、法務、人事など、11チーム・62体の定義済みエージェントが協働します。
*   **マルチモーダル入出力:**
    *   **Input:** テキスト、音声、画像、PDFなどのファイル入力に対応。
    *   **Output:** テキストレポート、Pythonによるグラフ描画、Mermaidによる構造図、画像生成、HTML/GASコード生成。
*   **可視化とインタラクション:**
    *   **Dependency Graph:** エージェント間のタスク依存関係を可視化するインタラクティブな組織図。
    *   **Artifact Workbench:** 生成されたHTMLやコードをサンドボックス環境でプレビュー。
*   **セッション管理:** プロジェクトの状態をローカルストレージに保存・復元可能。
*   **多言語対応:** 日本語と英語の切り替えに対応 (i18n)。

---

## 🛠️ 技術スタック (Tech Stack)

*   **Frontend:** React 19.2.0, TypeScript
*   **Styling:** Tailwind CSS (CDN)
*   **AI Model:** Google Gemini 3.0 Pro (Preview), Gemini 2.5 Pro, Gemini 2.5 Flash
*   **SDK:** `@google/genai` (v1.29.1+)
*   **Diagramming:** Mermaid.js
*   **Markdown:** Marked.js
*   **Buildless:** ES Modules via Import Map (No Webpack/Vite required for runtime)

---

## 🏗️ アーキテクチャ (Architecture)

本アプリケーションは、サーバーレスのクライアントサイドSPAとして動作します。

1.  **State Management (`useAgisState`):**
    *   アプリケーション全体の複雑な状態（メッセージログ、アーティファクト、グラフイベント）を一元管理するカスタムフック。
    *   `AgisContext` を通じてコンポーネントツリー全体に提供されます。

2.  **Orchestration Engine (`useOrchestrator` & `orchestratorTools`):**
    *   オーケストレーターAIの思考ループ（Thinking Loop）を制御。
    *   GeminiのFunction Callingを利用し、`invoke`, `consult`, `review`, `add_member` などのツール実行を `services/orchestratorTools.ts` で処理します。

3.  **President Logic (`presidentOperations`):**
    *   プロジェクト開始時のチーム編成と、最終成果物のレビュー・推敲プロセスを独立したモジュールとして実装。
    *   品質が基準に満たない場合、自律的に「再指示（Re-instruct）」を行い、ループを継続させます。

4.  **Content Processing (`contentProcessor` & `reportGenerator`):**
    *   AIの出力に含まれるMarkdown、コードブロック、特殊タグ（`<GENERATE_IMAGE>`, `<FIGURE>`）を解析。
    *   Word/HTML/Markdown形式でのレポート出力機能をサポート。

---

## 🤖 エージェント構成 (The Agents)

### リーダーシップ (Leadership)
| ID | 名前 | 役割 |
| :--- | :--- | :--- |
| `president` | プレジデント | 最高意思決定者。戦略指令書の作成、チーム編成、最終レビュー。 |
| `orchestrator` | オーケストレーター | プロジェクト管理者。タスク分解、進捗管理、品質保証、ナレッジ管理。 |

### 専門家チーム (Specialist Teams)
計10チーム、60名のエージェントが定義されています。

*   **戦略計画チーム:** マーケット分析(A1)、事業戦略(A7)、未来予測(A11) 等
*   **インサイト＆カルチャーチーム:** ユーザー調査(A2)、データ可視化(A10)、行動心理(A26) 等
*   **製品デザインチーム:** アイデア(A3)、UX設計(A4)、UIデザイン(A8)、コピーライティング(A9) 等
*   **アドバンスト開発チーム:** 技術検証(A5)、QA(A15)、プロンプトエンジニア(C2) 等
*   **運用＆インフラチーム:** SRE(A22)、DevOps(A23)、クラウドインフラ(B26) 等
*   **セキュリティ＆ガバナンス:** リスク評価(A6)、法務(A12)、セキュリティ(A13) 等
*   **グロースマーケティング:** GTM戦略(A14)、コンテンツ(A16)、SNS(A18) 等
*   **セールスチーム:** パートナーシップ(A20)、フィールドセールス(B8) 等
*   **渉外・広報チーム:** PR(A17)、IR(B6)、危機管理(B24) 等
*   **財務・SCM / 人事・総務:** CFO(B1)、CHRO(B2)、採用(B19) 等

---

## 📂 ディレクトリ構造

```text
/
├── index.html              # エントリーポイント
├── index.tsx               # Reactマウント
├── App.tsx                 # メインレイアウト
├── types.ts                # 型定義
├── constants.ts            # エージェント定義・定数
├── config/                 # モデル設定、ツール定義
├── contexts/               # Context (Agis, Language)
├── hooks/                  # Custom Hooks (State, Orchestrator, Session...)
├── services/               # API連携, ロジック (Gemini, Tools, Sound...)
├── utils/                  # ユーティリティ (Report, Content Parsing...)
├── components/
│   ├── agents/             # エージェント関連UI (Card, Grid)
│   ├── common/             # 汎用UI (CodeBlock, Toast)
│   ├── layout/             # レイアウト (Header, UserInput)
│   ├── modals/             # 各種モーダル
│   └── visuals/            # 視覚化コンポーネント (Mermaid, Artifacts)
└── prompts/                # システムプロンプト集
```

---

## 📝 使い方

1.  **APIキーの設定:** 環境変数 `API_KEY` が必要です（コード内では `process.env.API_KEY` として参照）。
2.  **指示の入力:** 入力フォームにプロジェクトのゴールや解決したい課題を入力します。
3.  **観察:** プレジデントがチームを編成し、オーケストレーターがタスクを割り振る様子をリアルタイムで観察できます。
4.  **介入:** 必要に応じて、進行中のプロセスに対して追加の指示や回答を行うことができます。
5.  **成果物:** 生成されたレポート、画像、コードはダウンロード可能です。
