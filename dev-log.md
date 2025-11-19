
# A.G.I.S. Technical Documentation & Development Log

**Project Name:** A.G.I.S. (AI Generative Intelligence System)
**Version:** 4.0 (Refactoring & UI Modernization Complete)
**Description:** Google Gemini 2.5/3.0 モデル群を活用した、自律型階層的マルチエージェント組織シミュレーションシステム。

---

## 1. アーキテクチャ概要 (Version 4.0)

本アプリケーションは、React (TypeScript) をフロントエンドとし、Google Gemini APIをバックエンドの推論エンジンとして利用するクライアントサイド・アプリケーション（SPA）です。Version 4.0へのアップデートにより、ビジネスロジックとUIの分離が徹底され、保守性と拡張性が大幅に向上しました。

### 1.1. コア・アーキテクチャの変化

*   **Flux-like State Management:**
    *   以前は `App.tsx` に集中していた状態管理を `hooks/useAgisState.ts` に分離。
    *   `AgisContext` を通じて、深いコンポーネント階層でもPropsバケツリレーなしに状態へアクセス可能に。
*   **Logic Separation:**
    *   **Orchestrator Logic:** `hooks/useOrchestrator.ts` と `services/orchestratorTools.ts` に分離。思考ループとツール実行ロジックを明確に区別。
    *   **President Logic:** `services/presidentOperations.ts` に分離。レビュー、推敲（Refinement）、再指示のフローを独立化。
*   **Visual Components:**
    *   Markdown、Mermaid、Artifact（画像/グラフ）のレンダリングロジックを `components/visuals/` 配下に集約。
    *   `utils/contentProcessor.ts` により、混合コンテンツ（テキスト、コード、タグ）のパース処理を統一。

---

## 2. ファイル構造と責務 (Current Structure)

```text
/
├── index.html              # エントリーポイント、Tailwind CDN、Import Map
├── index.tsx               # Reactマウント
├── App.tsx                 # アプリケーションルート（レイアウト構成）
├── types.ts                # 型定義 (Agent, Message, Team, Artifact)
├── constants.ts            # エージェント定義マスタ (AGENTS), チームカラー設定
├── config/
│   ├── models.ts           # Geminiモデル設定（Thinking Config等）
│   └── tools.ts            # Function Calling定義（Orchestrator用）
├── contexts/
│   ├── AgisContext.tsx     # アプリケーション全体の状態提供
│   └── LanguageContext.tsx # 多言語対応 (i18n)
├── hooks/
│   ├── useAgis.ts          # Contextアクセスのショートカット
│   ├── useAgisState.ts     # 状態管理ロジック（Reducer的役割）
│   ├── useOrchestrator.ts  # オーケストレーターの思考ループ制御
│   ├── useSession.ts       # LocalStorageへの保存/読み込み
│   └── useSmartScroll.ts   # 自動スクロール制御
├── services/
│   ├── geminiService.ts    # Gemini API ラッパー (generateContentStream)
│   ├── orchestratorTools.ts# ツール実行ロジック (invoke, consult, etc.)
│   ├── presidentOperations.ts # プレジデントのレビュー/推敲ロジック
│   └── soundService.ts     # Web Audio APIによるSE
├── utils/
│   ├── contentProcessor.ts # Markdown/HTML/タグのパース処理
│   └── reportGenerator.ts  # レポート出力（HTML/Word/Markdown）生成
├── components/
│   ├── agents/             # AgentCard, AgentGrid
│   ├── common/             # CodeBlock, Toast
│   ├── layout/             # Header, UserInput
│   ├── modals/             # KnowledgeBase, SessionManager, Graph, ErrorLog, Preview
│   └── visuals/            # MarkdownRenderer, MermaidBlock, ArtifactRenderer
└── prompts/
    ├── genesisDocument.ts  # 共通憲法
    ├── agentPrompts.ts     # プロンプト集約ファイル
    └── agents/             # 各エージェントの個別プロンプトファイル
```

---

## 3. 主要機能の実装詳細

### 3.1. 自律オーケストレーション (`useOrchestrator.ts`)
オーケストレーターは以下のサイクルで動作します。

1.  **Thinking Phase:** 現在の状況、コンテキスト、知識ベースを元に、Gemini APIを呼び出し思考を行います。
2.  **Tool Selection:** `config/tools.ts` で定義されたツール（`invoke`, `invoke_parallel`, `complete` 等）から最適なものを選択します。
3.  **Tool Execution (`orchestratorTools.ts`):** 選択されたツールを実行し、GraphEventの発行やエージェントの呼び出しを行います。
    *   *改善点:* ツール実行ロジックを別ファイルに切り出したことで、将来的なツールの追加（例: Web検索ツールの強化）が容易になりました。
4.  **Recursive Loop:** ミッションが完了するか、人間の介入が必要になるまで、このサイクルを繰り返します。

### 3.2. アーティファクト管理システム
エージェントが生成した成果物（画像、グラフ、コード）は `Artifact` オブジェクトとして一元管理されます。

*   **画像生成:** `<GENERATE_IMAGE>` タグを検出し、`gemini-2.5-flash-image` モデル等で画像を生成。Base64として保持。
*   **グラフ描画:** Pythonコード実行結果として得られた画像や、Mermaid記法のダイアグラムをレンダリング。
*   **プレビュー:** `ArtifactPreviewModal` により、生成されたHTMLコードなどをサンドボックス内で安全にプレビュー可能。

### 3.3. レポート生成エンジンの刷新 (`reportGenerator.ts`)
*   **Word出力:** HTML構造を解析し、Microsoft Wordが解釈可能なMHTML互換形式に変換。不要なスクリプトを除去し、画像のサイズ調整を行うことで、「ファイルが開けない」問題を解決。
*   **テキスト整形:** HTMLからMarkdown/Textへの変換時に、不要なインデントや空行を適切にトリムするロジックを追加。

---

## 4. 開発履歴 (Recent Changes)

### Version 4.0 (UI/UX Refinement & Modularization)
*   **UI Logic Separation:** `useSmartScroll` フックの作成と、レンダリングロジックの `contentProcessor.ts` への分離。
*   **Component Restructuring:** コンポーネントを `visuals`, `common`, `agents` 等のディレクトリに整理。
*   **Report Quality:** Word/Markdownのエクスポート品質向上。インデント崩れやファイル破損の修正。

### Version 3.8 (Artifact & Preview)
*   **Artifact System:** 生成物（画像、ファイル）を一元管理する仕組みを導入。
*   **HTML Preview:** エージェントが生成したHTML/CSS/JSをモーダルでプレビューする機能を追加。

### Version 3.7 (Session & Graph)
*   **Session Management:** プロジェクトの状態をローカルストレージに保存・復元・削除する機能。
*   **Dependency Graph:** Mermaid.js を使用した、動的な組織図・タスク依存関係の可視化。

---

## 5. 今後の課題 (TODO)

1.  **RAG (Retrieval-Augmented Generation) の強化:** 現在はコンテキストウィンドウに依存しているが、ベクトルデータベース等を活用した長期記憶の実装。
2.  **Web検索機能の拡張:** オーケストレーターだけでなく、調査専門エージェント（Analyst等）が自律的に検索ツールを使用できる権限移譲。（実装済み）
3.  **音声対話モード:** Gemini Live APIを活用した、リアルタイム音声対話の実装検討。

---
*End of Document*
