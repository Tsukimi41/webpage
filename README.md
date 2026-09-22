# webpage

Astroで構築した個人サイトです。

## ローカル起動

```powershell
npm ci
npm run dev
```

## GitHub Pagesへの公開

公開先は `https://tsukimi41.github.io/webpage/` です。

1. 公開するコンテンツの `state` を `published` に変更する。
2. 次のコマンドが `Release readiness: READY` で完了することを確認する。

   ```powershell
   $env:PUBLIC_SITE_URL = 'https://tsukimi41.github.io/webpage/'
   npm run build:release
   ```

3. 変更を `main` ブランチへ反映する。
4. GitHubのリポジトリ設定で **Settings → Pages → Source** を **GitHub Actions** にする。

`main`へのpush、またはActions画面からの手動実行で `.github/workflows/deploy.yml` が公開します。公開前チェックに失敗した場合はデプロイされません。
