# right-now

今この瞬間に心の中を去来する「気持ち」や「気分」を、質問形式で入力し、
嘘発見機風のグラフとフラクタル（L-system）幾何学模様としてイメージ化する LP。

## 機能
- 5つの質問をスライダーで回答（0〜100）
- ロールシャッハ風インクブロット（手続き生成）**3枚**へ、それぞれ解釈入力
- 嘘発見機風の生成中アニメーション
- 回答を波形グラフ + フラクタル模様（L-system）として可視化
- URL ハッシュ（`#50-60-30-70-40-40-55-45`、最後3つは各ロールシャッハ強度）で結果を共有可能
  - 旧形式（`#a-b-c-d-e-r`、6パーツ）も互換として読み込み可（末尾の1つを全強度に適用）
- 結果を**タイムスタンプ付きPNG**として保存（`right-now_YYYYMMDD-HHMMSS.png`）
- **QRコード共有**: 結果画像をLocalStorageに保存し、`?img=token` のQRを生成。スマホ等で読み取ると保存画像を表示（同一ブラウザ/同一オリジン）
- QRコード生成は CDN（jsDelivr の qrcode）を使用

## 注意
- LocalStorage は**オリジン・ブラウザ単位**。QRコードは同じブラウザで開いた場合のみ画像を復元します。
- `?img=token` で開くと保存済み画像をライトボックス表示し、そこから再ダウンロードできます。

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
render/graph.js / render/fractal.js / render/rorschach.js / render/anim.js
.github/workflows/pages.yml
```
