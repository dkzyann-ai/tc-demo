# テスト作成ツール DEMO

学校教員が数学I・Aの問題を管理し、テストを作成・印刷できるWindows向けローカルアプリです。

## 実装済み機能

- 3画面構成（テスト作成、テスト履歴、問題作成）
- 問題選択、個別配点、上下ボタンによる順序変更
- テストの保存、再編集、削除
- 問題用紙と答えのA4プレビュー・印刷、問題画像の差し込み
- 問題・テストのPC内SQLite保存

初回起動時には、操作確認用の問題5件と保存済みテスト2件を自動で用意します。利用者が問題またはテストを登録済みの場合は追加しません。
共有、正式認証、他教科、クラウド同期はDEMO対象外です。

## 開発

WSL上で次を実行します。

```bash
npm install
npm run dev
```

検証コマンドです。

```bash
npm run typecheck
npm test
npm run build:renderer
```

## Windows配布物

`npm run build:win` は、圧縮済みのWindowsポータブルEXEを生成します。
先生へ渡す配布物は、次のZIPです。

`release/テスト作成ツール_DEMO_0.1.0_軽量版.zip`

このZIPは展開後、`テスト作成ツール DEMO.exe` を起動する方式です。配布サイズは約81.7MBです。利用者側にWSL、Node.js、Docker、クラウドアカウントは必要ありません。
詳細は [先生向け手順書](docs/先生向け手順書.md) を参照してください。

## 技術方針

- 主言語：TypeScript
- DEMO：Electron + React。問題・テストは利用PCのアプリ用データフォルダ内のSQLiteファイルに保存する。
- 本番候補：ReactのWeb画面、Node.jsのバックエンドAPI、PostgreSQL。

詳細は [技術方針と将来拡張](docs/ナレッジ/技術方針と将来拡張.md) を参照してください。
