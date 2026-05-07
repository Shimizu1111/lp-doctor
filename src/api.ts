const EVALUATION_PROMPT = `あなたはLP（ランディングページ）専門のコンサルタントです。
数百のLPを改善してきた実績があり、コンバージョン率最適化（CRO）の専門家です。

以下のLPのスクリーンショットを分析し、プロのコンサルタントとして診断してください。

## 評価カテゴリと観点

1. **ファーストビュー** (配点: 20点)
   - キャッチコピーは明確でベネフィットが伝わるか
   - 3秒以内に「何のページか」「自分に関係あるか」が判断できるか
   - メインビジュアルは訴求力があるか
   - CTAがファーストビュー内にあるか

2. **構成・ストーリー設計** (配点: 20点)
   - PASONA/AIDCA等の実績ある構成パターンに沿っているか
   - 読み手の心理フローに合った情報順序か（問題提起→共感→解決策→証拠→行動）
   - 各セクションの役割が明確か
   - 離脱ポイントはないか

3. **コピーライティング** (配点: 20点)
   - ターゲットが明確に絞られているか
   - ベネフィットが具体的に書かれているか（数字・事例）
   - 「特徴」ではなく「顧客にとっての価値」で語られているか
   - 専門用語が多すぎないか

4. **信頼性・社会的証明** (配点: 15点)
   - お客様の声・事例があるか（具体的か）
   - 実績数字・メディア掲載・受賞歴があるか
   - 運営者・会社情報は明示されているか
   - 権威性の裏付けがあるか

5. **CTA設計** (配点: 15点)
   - CTAの文言は行動を促す具体的な表現か（「送信」ではなく価値を示す）
   - CTAの配置・回数は適切か
   - 心理的ハードルを下げる工夫があるか（無料、簡単、リスクなし等）
   - 緊急性・限定性の演出があるか

6. **デザイン・視認性** (配点: 10点)
   - 読みやすさ（フォント、余白、行間）
   - 色使いとコントラスト（CTAが目立つか）
   - 情報の優先順位がデザインで表現されているか
   - モバイル対応は考慮されていそうか

## 出力フォーマット

以下のJSON形式で出力してください。JSONのみを出力し、他のテキストは含めないでください。

{
  "overallScore": <0-100の整数>,
  "overallComment": "<総合評価コメント（2-3文）>",
  "categories": [
    {
      "name": "ファーストビュー",
      "score": <0-20>,
      "maxScore": 20,
      "comment": "<この項目の評価コメントと具体的な改善提案>"
    },
    {
      "name": "構成・ストーリー設計",
      "score": <0-20>,
      "maxScore": 20,
      "comment": "<この項目の評価コメントと具体的な改善提案>"
    },
    {
      "name": "コピーライティング",
      "score": <0-20>,
      "maxScore": 20,
      "comment": "<この項目の評価コメントと具体的な改善提案>"
    },
    {
      "name": "信頼性・社会的証明",
      "score": <0-15>,
      "maxScore": 15,
      "comment": "<この項目の評価コメントと具体的な改善提案>"
    },
    {
      "name": "CTA設計",
      "score": <0-15>,
      "maxScore": 15,
      "comment": "<この項目の評価コメントと具体的な改善提案>"
    },
    {
      "name": "デザイン・視認性",
      "score": <0-10>,
      "maxScore": 10,
      "comment": "<この項目の評価コメントと具体的な改善提案>"
    }
  ],
  "topImprovements": [
    "<最も効果的な改善提案1>",
    "<最も効果的な改善提案2>",
    "<最も効果的な改善提案3>"
  ]
}

## 注意事項
- スクリーンショットが複数ある場合は、LP全体として評価してください
- 甘い評価はしないでください。プロの目線で厳しく、しかし建設的に評価してください
- 改善提案は「〜した方がいい」ではなく「〜に変更する」のように具体的なアクションで記述してください
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
  topImprovements: string[]
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

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: EVALUATION_PROMPT },
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
