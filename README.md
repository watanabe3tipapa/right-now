# right-now

今この瞬間に心の中を去来する「気持ち」や「気分」を、質問形式で入力し、
嘘発見機風のグラフとフラクタル（L-system）幾何学模様としてイメージ化する LP。

## 機能
- 5つの質問をスライダーで回答（0〜100）
- 嘘発見機風の生成中アニメーション
- 回答を波形グラフ + フラクタル模様（L-system）として可視化
- URL ハッシュ（`#50-60-30-70-40`）で結果を共有可能

## ローカルで起動
```bash
python3 -m http.server 8000
# http://localhost:8000
```

## GitHub Pages への公開（GitHub Actions）
1. リポジトリを作成し push する。
2. GitHub 上で **Settings → Pages** を開き、Source を **GitHub Actions** に設定。
3. `main` ブランチへの push で `pages.yml` が自動的にデプロイする。

## 構成
```
index.html / style.css / app.js / questions.js
render/graph.js / render/fractal.js / render/anim.js
.github/workflows/pages.yml
```
