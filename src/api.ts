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
      "title": "<改善ポイントの見出し（短く具体的に）>",
      "current": "<現状の問題点。LPから読み取れる実際のテキストや要素を引用しながら、何が不足・不適切かを3文以上で詳しく指摘>",
      "copyExample": {
        "before": "<現在のLPに書かれているコピーやCTAテキストをそのまま引用（読み取れない場合は推測して明記）>",
        "after": "<改善後の具体的なコピー案を提示。数値・ベネフィット・緊急性を盛り込んだ実践的な文言>"
      },
      "action": "<具体的な改善アクション。何をどう変えるべきかをビジネス要件レベルで記述（コード・HTML・CSSの詳細は不要）>",
      "expectedImpact": "<この改善で期待されるCVR改善幅や具体的効果を、業界ベンチマーク数値を引用して記述>",
      "reason": "<なぜこの改善が効くのか、行動心理学・CROの原則・ルーブリック内の業界データを根拠に3文以上で論理的に説明>",
      "claudeCodePrompt": "<この改善をClaude Codeで実装するための指示文。ビジネス要件・ユーザー体験の観点で「何を達成したいか」「どんな印象・効果を狙うか」を明確に伝える。コードレベルの実装詳細（HTML構造・CSS指定・コンポーネント名など）は書かない>"
    }
  ],
  "strategicAdvice": [
    {
      "title": "<戦略的アドバイスの見出し（例：コンセプトの明確化、ターゲット再定義など）>",
      "description": "<LPの表面的な改善ではなく、そもそも決めておくべき戦略的な事項について3文以上で具体的にアドバイス。なぜこれを先に決めるべきかの理由も含める>",
      "questions": [
        "<このアドバイスに関して、LP制作者が自問すべき具体的な問い（例：「競合と比較して、あなたのサービスだけが提供できる価値は何か？」）>",
        "<同上、2つ目の問い>",
        "<同上、3つ目の問い>"
      ]
    }
  ]
}

## 注意事項
- スクリーンショットが複数ある場合は、LP全体として評価してください
- 甘い評価はしないでください。プロの目線で厳しく、しかし建設的に評価してください
- 改善提案は「〜した方がいい」ではなく「〜に変更する」のように具体的なアクションで記述してください
- topImprovementsは3件出力してください。各項目は「読んだ人がそのまま実装に着手できる」レベルの具体性で書いてください
- topImprovementsの各フィールドは省略せず、すべて充実した内容で埋めてください
- currentは3文以上で、LPの実際のテキストや構成要素を引用しながら問題点を指摘してください
- copyExampleのafterは、そのままLPに貼り付けられる実践的なコピー案を書いてください
- actionはビジネス要件レベルで記述してください。HTML・CSS・コード構造の詳細は不要です
- expectedImpactには、ルーブリック内の業界ベンチマーク数値を引用し、改善前後の差を定量的に示してください
- reasonは3文以上で、行動心理学やCROの原則を交えて論理的に説明してください
- claudeCodePromptは、Claude Code（AIコーディングアシスタント）にそのままコピペして使える指示文を書いてください。「何を達成したいか」「どんなユーザー体験を実現したいか」をビジネス要件として伝えてください。HTML・CSS・コンポーネント名などコードレベルの実装詳細は書かないでください（実装方法はClaude Codeが判断します）
- strategicAdviceは2〜4件出力してください。LPの表面的な修正ではなく、コンセプト設計・ターゲット定義・ポジショニング・差別化戦略・顧客理解など、LP制作の「上流工程」で決めるべき事項をアドバイスしてください
- strategicAdviceのquestionsには、LP制作者が自分のビジネスについて自問すべき具体的な問いを2〜4つ書いてください
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
    copyExample: {
      before: string
      after: string
    }
    action: string
    expectedImpact: string
    reason: string
    claudeCodePrompt: string
  }[]
  strategicAdvice: {
    title: string
    description: string
    questions: string[]
  }[]
}

export interface ModelOption {
  id: string
  label: string
}

const PROXY_BASE = 'https://lp-doctor-proxy.foritemaqua.workers.dev'

export async function fetchModels(apiKey: string): Promise<ModelOption[]> {
  const response = await fetch(`${PROXY_BASE}/v1/models`, {
    method: 'GET',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  })

  if (!response.ok) {
    throw new Error('モデル一覧の取得に失敗しました')
  }

  const data = await response.json()
  const models: { id: string; display_name?: string }[] = data.data || []

  return models
    .filter((m) => m.id.startsWith('claude-'))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((m) => ({
      id: m.id,
      label: m.display_name || m.id,
    }))
}

export async function diagnoseLP(
  apiKey: string,
  images: string[],
  model: string,
): Promise<DiagnosisResult> {
  const t0 = performance.now()

  const imageContent = images.map((img) => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: img.startsWith('data:image/png') ? 'image/png' as const : 'image/jpeg' as const,
      data: img.replace(/^data:image\/\w+;base64,/, ''),
    },
  }))

  const totalImageBytes = imageContent.reduce((sum, img) => sum + img.source.data.length, 0)
  const systemPromptBytes = new Blob([SYSTEM_PROMPT]).size
  const userPromptBytes = new Blob([USER_PROMPT]).size
  console.log(`[diagnoseLP] 画像数: ${images.length}, 画像合計: ${(totalImageBytes / 1024).toFixed(0)}KB, システムプロンプト: ${(systemPromptBytes / 1024).toFixed(1)}KB, ユーザープロンプト: ${(userPromptBytes / 1024).toFixed(1)}KB`)

  const body = JSON.stringify({
    model,
    max_tokens: 16384,
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
  })
  console.log(`[diagnoseLP] リクエストbody合計: ${(body.length / 1024).toFixed(0)}KB`)

  const t1 = performance.now()
  console.log(`[diagnoseLP] リクエスト構築: ${(t1 - t0).toFixed(0)}ms`)

  const response = await fetch(`${PROXY_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body,
  })

  const t2 = performance.now()
  console.log(`[diagnoseLP] API応答待ち: ${(t2 - t1).toFixed(0)}ms (${((t2 - t1) / 1000).toFixed(1)}秒)`)

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || `API error: ${response.status}`)
  }

  const data = await response.json()
  const t3 = performance.now()
  console.log(`[diagnoseLP] レスポンスparse: ${(t3 - t2).toFixed(0)}ms`)

  const usage = data.usage
  if (usage) {
    console.log(`[diagnoseLP] トークン使用量 - input: ${usage.input_tokens}, output: ${usage.output_tokens}`)
  }

  if (data.stop_reason === 'max_tokens') {
    throw new Error('診断結果の生成が途中で打ち切られました。出力トークン数の上限に達したため、完全な結果を取得できませんでした。')
  }

  const text = data.content[0].text
  console.log(`[diagnoseLP] レスポンステキスト長: ${text.length}文字`)
  console.log(`[diagnoseLP] 合計所要時間: ${((t3 - t0) / 1000).toFixed(1)}秒`)

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('APIからの応答をパースできませんでした')
  }

  return JSON.parse(jsonMatch[0]) as DiagnosisResult
}

export async function captureScreenshot(url: string): Promise<string> {
  const t0 = performance.now()
  console.log(`[captureScreenshot] 取得開始: ${url}`)

  const screenshotUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`

  const response = await fetch(screenshotUrl)
  const t1 = performance.now()
  console.log(`[captureScreenshot] API応答: ${(t1 - t0).toFixed(0)}ms (${((t1 - t0) / 1000).toFixed(1)}秒)`)

  if (!response.ok) {
    throw new Error('スクリーンショットの取得に失敗しました')
  }

  const blob = await response.blob()
  console.log(`[captureScreenshot] 画像サイズ: ${(blob.size / 1024).toFixed(0)}KB`)

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      console.log(`[captureScreenshot] 合計: ${((performance.now() - t0) / 1000).toFixed(1)}秒`)
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
