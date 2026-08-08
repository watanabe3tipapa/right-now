# DEV-MEMO: right-now

## 概要
「今この瞬間」の気持ち・気分を質問形式で入力し、
嘘発見機風UI + フラクタル(L-system)幾何学模様でイメージ化する LP。
GitHub Actions で GitHub Pages に公開。

## 決定事項
- 入力方式: 質問形式（スライダー式・数値回答 0〜1）
- 可視化: 嘘発見機グラフ + フラクタル = L-system（木/枝分かれ）
- 生成中アニメ: 嘘発見機風・精密な外見（グリッド/目盛り/ペン描画/波形）
- スタック: Vanilla JS + Canvas 2D、外部依存なし
- 公開: GitHub Actions → GitHub Pages

## 回答値 → フラクタル/グラフのマッピング案
- 分岐角度 / 反復深さ / 対称性 / 枝の太さ 等を回答スケール値に割当
- シード化し、同じ回答なら毎回同じ模様（URL ハッシュで共有可）

## 質問設計（スライダー式 5問）
| id | 文言（左:0 → 右:1） | 意味 |
|----|--------------------|------|
| arousal | 沈んでいる → 高揚している | 活性度 |
| anxiety | 穏やか → 焦っている | 焦燥 |
| fatigue | 元気 → 疲れ切っている | 疲労 |
| focus | 散漫 → 集中している | 集中 |
| openness | 閉じている → 開いている | 開放性/接続 |

## マッピング（L-system パラメータ）
- 角度 = lerp(15°, 40°, arousal) + 非対称化(anxiety)
- 反復深さ = 5 + round(focus)
- 枝の太さ比 = lerp(0.5, 0.9, fatigue 逆転)
- 対称性 = lerp(対称, 非対称, anxiety)
- 全体サイズ/色相 = openness
回答配列から決定的ハッシュでシード生成。

## 嘘発見機グラフ
回答値をプロットとして時系列波形化。グリッド + 目盛り + ペン描画のライン。
各質問の値が波の振幅/周期に影響。

## ファイル構成
- index.html
- style.css
- app.js
- questions.js
- render/graph.js
- render/fractal.js
- render/anim.js
- .github/workflows/pages.yml
- DEV-MEMO.md / README.md

## 残タスク/未定
- フラクタルのパラメータ係数の調整（外見チューニング）
- GitHub Pages ソース設定手順の README 化（済: README.md）
