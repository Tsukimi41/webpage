# パフォーマンス改善

GitHub Pagesの静的配信を維持する。APIやデータベース、常駐アプリケーションサーバーは追加しない。

| 項目 | 対応 |
| --- | --- |
| 記事一覧 | 6件ずつのページ分割。検索は全記事を対象にする |
| 入力ハンドラー | 120msのデバウンス。IME確定前は待機、送信時は即時更新 |
| 検索キャッシュ | ページ内で最大32条件を保持。ページ切替では同じ検索結果を再利用 |
| 不要な再描画 | 値が変わったDOM属性・テキストだけを更新 |
| コード分割・遅延ロード | ターミナルの演出は動的import。技術の玉は以前の常時表示へ復元し、物理演算を初期化する。画面外での演算停止は維持 |
| 非重要スクリプト | Astroが生成するmoduleスクリプトで解析を妨げずに実行。初期配色だけはちらつき防止のため早期実行 |
| JS・CSSの圧縮 | Astroの本番ビルドで最小化。開発サーバーのサイズと混同しない |
| 画像圧縮 | プロフィール・PNGの技術アイコンをWebP化。小型faviconを生成 |
| 画像の遅延読み込み | 技術アイコンとサイドバーに適用。先頭プロフィール画像は優先読み込み |
| 技術の玉 | 開閉パネル・静的一覧・専用スケルトンを撤去し、マーブルとシャボン玉を最初から表示。ドラッグ・投げる操作・接触・キーボード操作を復元 |
| ターミナル入口 | ホームだけで自動入力。ブラウザの保存領域で3回目ごとの打ち直しを管理 |
| スキップ | Esc。動きを減らす設定、アンカーリンク、履歴復元では省略 |
| 障害時 | JSなしでも本文を表示。演出失敗時は解除。演出JSの取得停滞は16秒、取得後の演出停滞は45秒のタイマーで入場 |
| 未使用依存 | 既存の直接依存はすべて使用箇所を確認。削除対象なし。sharpとLighthouseは開発用 |

技術のインタラクティブ表示は、開閉式に変更する直前の`100aa9a`の`SkillShowcase.astro`へ復元した。物理演算・配置・素材の設定は維持し、既存コードで欠落していた物理オブジェクトの`role`を初期化時に渡す修正を加えた。これによりスキルのシャボン玉の減衰振動と装飾シャボン玉の破裂・再生成が動作する。

ターミナルはArch Linux・Hyprland上のWezTermを参考にしたブラウザ内の演出。シェルの文字列は表示用で、実行しない。OS・WMの表示は演出用の設定であり、閲覧者の環境を検出した結果ではない。保存領域が利用できない場合も入場できるが、訪問回数は保持しない。

入口は通常約24秒、3回目の打ち直しを含む場合は約33秒（演出JS取得後の目安）。空のプロンプト2500ms、Arch情報の表示2000ms、入力前の待機3500ms、文字ごとに変化する入力約3064ms、実行前2000ms、`[Y/n]`での確認待ち2000ms、自動入力した`y`の表示800ms、3段階のログ表示5400ms、完了2200ms、退出820msで構成する。待機中のブロックカーソルは1.2秒周期で点滅し、ログの処理中は文字のスピナーを表示する。打ち間違えた回は、エラー表示・履歴の呼び戻し・消去・再入力前の間も設ける。

確認への回答は自動で行う演出であり、実際の認証・承認処理ではない。ログも通信量や実際のダウンロード進捗を示さない。操作案内・手動入場ボタン・Tabによるスキップは設けず、演出後に自動で入場する。Escによる解除と、動きを減らす設定での入口省略は維持する。

外観は[WezTermのretroタブ](https://wezterm.org/config/appearance.html#retro-tab-bar-appearance)とTokyo Night配色を基準にする。文字を同じセル幅で表示し、ブロックカーソル、fastfetchの出力、zshの履歴を構成する。誤ったコマンドとエラーは履歴に残し、次のプロンプトで履歴を呼び戻して打ち直す。出力が画面を超えた場合はターミナル内部でカーソルへスクロールする。

- 等幅フォント：[JetBrains Mono v2.304](https://github.com/JetBrains/JetBrainsMono/tree/v2.304)、Regular WOFF2（92,164 bytes）。ローカル配信し、OFL-1.1ライセンスを`public/fonts/JetBrainsMono-OFL.txt`に同梱する。
- Arch ASCIIロゴ：[fastfetch](https://github.com/fastfetch-cli/fastfetch/tree/3ccaf2d7dd67167be2b2208f0dd210aaecc9fadd/src/logo/ascii/a)の`arch.txt`と`arch_small.txt`。狭い画面は公式の小型版を使う。MITライセンスを`public/licenses/fastfetch.txt`に同梱する。

## 配信基盤と対象外の項目

2026-10-10に公開中サイトのHEADレスポンスで、`Content-Encoding: gzip`、`Cache-Control: max-age=600`、`Vary: Accept-Encoding`、`X-Served-By`、`X-Fastly-Request-ID`を確認した。既存のGitHub Pagesのエッジ配信・キャッシュ・圧縮を維持する。この確認は公開中の旧版に対するものであり、今回のPRのデプロイ確認ではない。

ロードバランサーや追加CDNの構築、サーバーキャッシュは今回追加しない。APIレスポンス圧縮・APIキャッシュ、DBインデックス・接続プール・N+1解消は対象となるAPI・DBがないため適用しない。ブラウザ側の検索キャッシュとサーバーキャッシュは区別する。

## 画像の再生成

```sh
npm ci
npm run optimize:images
```

`public/favicon.ico`と元PNGを保持し、生成画像をGit管理する。

| 配信用画像 | 変更前 | 変更後 |
| --- | ---: | ---: |
| プロフィール | ICO 131,716 bytes | WebP 13,788 bytes |
| サイドバー | 同上 | 128px WebP 4,912 bytes |
| favicon | ICO 131,716 bytes | 32px PNG 1,874 bytes |
| VOICEVOX | PNG 4,687 bytes | WebP 1,000 bytes |
| WSL | PNG 68,779 bytes | WebP 7,814 bytes |

## Lighthouseの再実行

Node.js 22.19以降が必要。CIではNode.js 24を使う。

```sh
npm ci
npx playwright install chromium
npm run audit:lighthouse
```

本番ビルドを作り、`/webpage/`配下のローカルプレビューでホームと記事一覧を監査する。既定のモバイル・シミュレーション条件を用い、入口を無効化する特別扱いはしない。HTML・JSONレポートと要約を`.lighthouse/`に保存する。公開操作は行わない。

PRのGitHub Actionsでも同じ処理を実行し、監査レポートを14日間保存する。大きな退行の検知用にPerformance 80、Accessibility・Best Practices・SEO各90を下限とする。ローカルの結果は実利用者の計測や本番CDNの応答時間を示すものではない。プレビューのキャッシュヘッダーは本番配信と異なる。

参照: [GitHub Pagesの静的配信](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)、[Lighthouse CLI](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md)。

## 今回のローカル監査結果

2026-10-10、Windows・Node.js 24.12.0・Lighthouse 13.5.0。ほかのブラウザテストを終了してから単独で測定した。変更前との同条件比較ではないため、スコア改善率は算出しない。

| ページ | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS | Speed Index |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| ホーム | 85 | 100 | 100 | 100 | 2.074秒 | 184ms | 0 | 27.793秒 |
| 記事一覧 | 90 | 100 | 100 | 100 | 1.382秒 | 30ms | 0 | 27.380秒 |

Speed Indexには大きな値が記録された。監査中のHTMLリクエスト完了は約18秒だった一方、同じプレビューを通常のNode fetchで読み切る確認ではホーム75ms・記事一覧17msだった。差の原因は特定しておらず、速さを保証する計測として扱わない。公開後は本番URLで改めて確認する。初回のブラウザテスト併走時はPerformance 77/50だったため、上表には単独実行の結果だけを載せた。

単体テスト115件と、Chromium・Firefox・WebKitの追加機能42件が成功。元の本文・記事操作も機能別PRの検証時に確認した。

### GitHub Actionsでの測定

同日の[CI実行](https://github.com/Tsukimi41/webpage/actions/runs/38035118664)はUbuntuで成功した。両ページとも4項目すべて100だった。

| ページ | LCP | TBT | CLS | Speed Index |
| --- | ---: | ---: | ---: | ---: |
| ホーム | 1.473秒 | 0ms | 0.000030 | 2.104秒 |
| 記事一覧 | 1.058秒 | 0ms | 0 | 1.058秒 |

Windowsで見られた大きなSpeed IndexはCIでは再現していない。公開環境の実利用者計測ではない点は同じ。今後の実行環境の変更による差を抑えるため、ワークフローはUbuntu 24.04を明示する。

## PRの依存順

各PRはひとつ前のブランチをbaseとする。取り込み時は親から順に確認し、親の取り込み後に子PRのbaseをmainへ変更する。スカッシュマージの場合は、子ブランチに親のコミットが残る点に注意する。

1. #4 既存6コミットの記事操作改善
2. #5 検索入力のデバウンス
3. #6 検索結果キャッシュと差分更新
4. #7 物理演算の遅延ロード
5. #8 画像圧縮
6. #9 ターミナル入口
7. #10 ローディングスケルトン
8. #11 3ブラウザ検証
9. Lighthouse監査とCI（この変更）
