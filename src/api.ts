import rubric01 from '../docs/rubrics/01-first-view.md?raw'
import rubric02 from '../docs/rubrics/02-story-structure.md?raw'
import rubric03 from '../docs/rubrics/03-copywriting.md?raw'
import rubric04 from '../docs/rubrics/04-trust-proof.md?raw'
import rubric05 from '../docs/rubrics/05-cta-conversion.md?raw'
import rubric06 from '../docs/rubrics/06-design-ux.md?raw'

const RUBRICS = [rubric01, rubric02, rubric03, rubric04, rubric05, rubric06].join('\n\n---\n\n')

const SYSTEM_PROMPT = `あなたはLP（ランディングページ）専門のコンサルタントです。
数百のLPを改善してきた実績があり、コンバージョン率最適化（CRO）の専門家です。

以下に、LP評価のための詳細なルーブリック（採点基準）を提示します。
各カテゴリの採点は、このルーブリックのスコア段階定義とチェックリストに**厳密に基づいて**行ってください。
ルーブリックに記載されたGood/Badパターンや業界ベンチマークも判断の根拠として活用してください。

=== ルーブリック ===
${RUBRICS}
=== ルーブリック終了 ===`

const USER_PROMPT = `上記のルーブリックに厳密に基づいて、このLPのスクリーンショットを診断してください。

## 採点プロセス
1. まず各カテゴリのチェックリストを1項目ずつ確認する
2. チェック結果をスコア段階定義に照合し、該当する段階のスコアを付ける
3. 段階の中間値ではなく、チェック結果の合致度に応じて段階内で細かく調整する
4. 各カテゴリのcommentには、チェックリストのどの項目が満たされ/不足しているかを具体的に記述する

## 出力フォーマット

以下のJSON形式で出力してください。JSONのみを出力し、他のテキストは含めないでください。

{
  "overallScore": <0-100の整数>,
  "overallComment": "<総合評価コメント（2-3文）>",
  "categories": [
    {
      "name": "ファーストビュー & ヒーローセクション",
      "score": <0-20>,
      "maxScore": 20,
      "comment": "<ルーブリックのどの基準に照合してこのスコアになったか、具体的に記述>"
    },
    {
      "name": "ストーリー構成 & 情報設計",
      "score": <0-15>,
      "maxScore": 15,
      "comment": "<ルーブリックのどの基準に照合してこのスコアになったか、具体的に記述>"
    },
    {
      "name": "コピーライティング & メッセージング",
      "score": <0-20>,
      "maxScore": 20,
      "comment": "<ルーブリックのどの基準に照合してこのスコアになったか、具体的に記述>"
    },
    {
      "name": "信頼性 & 社会的証明",
      "score": <0-10>,
      "maxScore": 10,
      "comment": "<ルーブリックのどの基準に照合してこのスコアになったか、具体的に記述>"
    },
    {
      "name": "CTA & コンバージョン設計",
      "score": <0-20>,
      "maxScore": 20,
      "comment": "<ルーブリックのどの基準に照合してこのスコアになったか、具体的に記述>"
    },
    {
      "name": "ビジュアルデザイン & UX",
      "score": <0-15>,
      "maxScore": 15,
      "comment": "<ルーブリックのどの基準に照合してこのスコアになったか、具体的に記述>"
    }
  ],
  "topImprovements": [
    {
      "title": "<改善ポイントの見出し>",
      "current": "<現状の問題点を具体的に指摘>",
      "action": "<具体的な改善アクション。何をどう変えるか手順レベルで書く>",
      "reason": "<なぜこの改善が効くのか、ルーブリックの業界ベンチマークを根拠に記述>"
    },
    {
      "title": "...",
      "current": "...",
      "action": "...",
      "reason": "..."
    },
    {
      "title": "...",
      "current": "...",
      "action": "...",
      "reason": "..."
    }
  ]
}

## 注意事項
- スクリーンショットが複数ある場合は、LP全体として評価してください
- 甘い評価はしないでください。プロの目線で厳しく、しかし建設的に評価してください
- 改善提案は「〜した方がいい」ではなく「〜に変更する」のように具体的なアクションで記述してください
- topImprovementsは、読んだ人が「これなら今すぐ直せる」と思えるレベルの具体性で書いてください
- topImprovementsのreasonには、ルーブリック内の業界ベンチマーク数値を引用してください
- スクリーンショットから読み取れない部分は、その旨を明記した上で推測で評価してください`

export interface DiagnosisResult {
  overallScore: number
  overallComment: string
  categories: {
    name: string
    score: number
    maxScore: number
    comment: string
  }[]
  topImprovements: {
    title: string
    current: string
    action: string
    reason: string
  }[]
}

export async function diagnoseLP(
  apiKey: string,
  images: string[],
): Promise<DiagnosisResult> {
  const imageContent = images.map((img) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: img.startsWith('data:image/png') ? 'image/png' as const : 'image/jpeg' as const,
      data: img.replace(/^data:image\/\w+;base64,/, ''),
    },
  }))

  const response = await fetch('https://lp-doctor-proxy.foritemaqua.workers.dev/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.content[0].text

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('APIからの応答をパースできませんでした')
  }

  return JSON.parse(jsonMatch[0]) as DiagnosisResult
}

export async function captureScreenshot(url: string): Promise<string> {
  const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`

  const response = await fetch(screenshotUrl)
  if (!response.ok) {
    throw new Error('スクリーンショットの取得に失敗しました')
  }

  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
