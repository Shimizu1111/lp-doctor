import { useState, useCallback, useRef, useEffect } from 'react'
import { diagnoseLP, captureScreenshot, fetchModels, type DiagnosisResult, type ModelOption } from './api'

type InputMode = 'upload' | 'url'
type AppState = 'input' | 'loading' | 'result'

function getScoreClass(score: number): string {
  if (score >= 70) return 'score-high'
  if (score >= 40) return 'score-mid'
  return 'score-low'
}

function getBarColor(score: number, max: number): string {
  const pct = (score / max) * 100
  if (pct >= 70) return 'var(--success)'
  if (pct >= 40) return 'var(--warning)'
  return 'var(--danger)'
}

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('lp-doctor-api-key') || '')
  const [keySaved, setKeySaved] = useState(() => !!localStorage.getItem('lp-doctor-api-key'))
  const [model, setModel] = useState(() => localStorage.getItem('lp-doctor-model') || '')
  const [models, setModels] = useState<ModelOption[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [images, setImages] = useState<string[]>([])
  const [url, setUrl] = useState('')
  const [appState, setAppState] = useState<AppState>('input')
  const [error, setError] = useState('')
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [dragover, setDragover] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('lp-doctor-api-key')
    if (saved) {
      setApiKey(saved)
      setKeySaved(true)
      loadModels(saved)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadModels = useCallback(async (key: string) => {
    setModelsLoading(true)
    try {
      const fetched = await fetchModels(key)
      setModels(fetched)
      if (!model && fetched.length > 0) {
        setModel(fetched[0].id)
      }
    } catch {
      setModels([])
    } finally {
      setModelsLoading(false)
    }
  }, [model])

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('lp-doctor-api-key', apiKey.trim())
      setKeySaved(true)
      loadModels(apiKey.trim())
    }
  }

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragover(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDiagnose = async () => {
    setError('')

    if (!apiKey.trim()) {
      setError('Claude APIキーを入力してください')
      return
    }

    if (!model) {
      setError('使用モデルを選択してください（APIキーを保存するとモデル一覧が取得されます）')
      return
    }

    let imagesToAnalyze = images

    if (inputMode === 'url') {
      if (!url.trim()) {
        setError('URLを入力してください')
        return
      }
      setAppState('loading')
      try {
        const screenshot = await captureScreenshot(url.trim())
        imagesToAnalyze = [screenshot]
      } catch (e) {
        setError(e instanceof Error ? e.message : 'スクリーンショット取得に失敗しました')
        setAppState('input')
        return
      }
    } else {
      if (images.length === 0) {
        setError('スクリーンショットをアップロードしてください')
        return
      }
      setAppState('loading')
    }

    try {
      const diagnosis = await diagnoseLP(apiKey.trim(), imagesToAnalyze, model)
      setResult(diagnosis)
      setAppState('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : '診断中にエラーが発生しました')
      setAppState('input')
    }
  }

  const handleReset = () => {
    setAppState('input')
    setResult(null)
    setImages([])
    setUrl('')
    setError('')
  }

  return (
    <div className="container">
      <h1>LP Doctor</h1>
      <p className="subtitle">AIがプロのコンサル目線であなたのLPを診断します</p>

      {error && <div className="error">{error}</div>}

      {appState === 'loading' && (
        <div className="loading">
          <div className="spinner" />
          <p>LPを診断中...</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            30秒〜1分ほどかかります
          </p>
        </div>
      )}

      {appState === 'input' && (
        <>
          {/* API Key */}
          <div className="card">
            <h2>Claude APIキー</h2>
            <div className="api-key-row">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value)
                  setKeySaved(false)
                }}
                placeholder="sk-ant-..."
              />
              <button className="btn btn-sm" onClick={saveApiKey}>
                保存
              </button>
            </div>
            {keySaved && <div className="saved-badge">保存済み（ブラウザに保存）</div>}
            {models.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <label htmlFor="model-select">使用モデル</label>
                <select
                  id="model-select"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value)
                    localStorage.setItem('lp-doctor-model', e.target.value)
                  }}
                >
                  {models.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            {modelsLoading && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                モデル一覧を取得中...
              </p>
            )}
          </div>

          {/* Input Mode */}
          <div className="card">
            <h2>LP情報の入力</h2>
            <div className="tabs">
              <button
                className={`tab ${inputMode === 'upload' ? 'active' : ''}`}
                onClick={() => setInputMode('upload')}
              >
                スクリーンショット
              </button>
              <button
                className={`tab ${inputMode === 'url' ? 'active' : ''}`}
                onClick={() => setInputMode('url')}
              >
                URL
              </button>
            </div>

            {inputMode === 'upload' ? (
              <>
                <div
                  className={`drop-zone ${dragover ? 'dragover' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragover(true)
                  }}
                  onDragLeave={() => setDragover(false)}
                  onDrop={handleDrop}
                >
                  <p>クリックまたはドラッグ&ドロップでスクリーンショットを追加</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    複数画像OK（LP全体をカバーするために複数枚推奨）
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                {images.length > 0 && (
                  <div className="multiple-images">
                    {images.map((img, i) => (
                      <div key={i} className="remove-thumb">
                        <img src={img} alt={`screenshot ${i + 1}`} className="thumb" />
                        <button className="remove-btn" onClick={() => removeImage(i)}>
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                <label htmlFor="url-input">LPのURL</label>
                <input
                  id="url-input"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/lp"
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  URLから自動でスクリーンショットを取得します
                </p>
              </div>
            )}
          </div>

          <button className="btn" onClick={handleDiagnose}>
            診断する
          </button>
        </>
      )}

      {appState === 'result' && result && (
        <>
          <div className="card">
            <div className="result-header">
              <div className={`overall-score ${getScoreClass(result.overallScore)}`}>
                {result.overallScore}
              </div>
              <div>
                <h2 style={{ marginBottom: '0.25rem' }}>総合スコア</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {result.overallComment}
                </p>
              </div>
            </div>

            {result.categories.map((cat) => (
              <div key={cat.name} className="category">
                <div className="category-header">
                  <span className="category-name">{cat.name}</span>
                  <span className="category-score">
                    {cat.score} / {cat.maxScore}
                  </span>
                </div>
                <div className="score-bar">
                  <div
                    className="score-bar-fill"
                    style={{
                      width: `${(cat.score / cat.maxScore) * 100}%`,
                      background: getBarColor(cat.score, cat.maxScore),
                    }}
                  />
                </div>
                <p className="category-comment">{cat.comment}</p>
              </div>
            ))}
          </div>

          {result.topImprovements.length > 0 && (
            <div className="card">
              <h2>優先改善ポイント TOP3</h2>
              {result.topImprovements.map((imp, i) => (
                <div key={i} className="improvement-item">
                  <div className="improvement-number">{i + 1}</div>
                  <div className="improvement-body">
                    <h3 className="improvement-title">{imp.title}</h3>
                    <div className="improvement-section">
                      <span className="improvement-label improvement-label--current">現状の問題</span>
                      <p>{imp.current}</p>
                    </div>
                    {imp.copyExample && (
                      <div className="improvement-section">
                        <span className="improvement-label improvement-label--copy">Before / After</span>
                        <div className="copy-example">
                          <div className="copy-example-item copy-example-before">
                            <span className="copy-example-tag">Before</span>
                            <p>{imp.copyExample.before}</p>
                          </div>
                          <div className="copy-example-item copy-example-after">
                            <span className="copy-example-tag">After</span>
                            <p>{imp.copyExample.after}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="improvement-section">
                      <span className="improvement-label improvement-label--action">具体的な改善アクション</span>
                      <p>{imp.action}</p>
                    </div>
                    {imp.steps && imp.steps.length > 0 && (
                      <div className="improvement-section">
                        <span className="improvement-label improvement-label--steps">実装ステップ</span>
                        <ol className="improvement-steps">
                          {imp.steps.map((step, j) => (
                            <li key={j}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {imp.expectedImpact && (
                      <div className="improvement-section">
                        <span className="improvement-label improvement-label--impact">期待される効果</span>
                        <p>{imp.expectedImpact}</p>
                      </div>
                    )}
                    <div className="improvement-section">
                      <span className="improvement-label improvement-label--reason">なぜ効くのか</span>
                      <p>{imp.reason}</p>
                    </div>
                    {imp.claudeCodePrompt && (
                      <div className="improvement-section">
                        <span className="improvement-label improvement-label--prompt">Claude Code 指示文</span>
                        <div className="prompt-block">
                          <pre>{imp.claudeCodePrompt}</pre>
                          <button
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(imp.claudeCodePrompt)
                            }}
                          >
                            コピー
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {result.strategicAdvice && result.strategicAdvice.length > 0 && (
            <div className="card">
              <h2>戦略アドバイス</h2>
              <p className="strategic-subtitle">LP改善の前に決めておくべきこと</p>
              {result.strategicAdvice.map((advice, i) => (
                <div key={i} className="strategic-item">
                  <h3 className="strategic-title">{advice.title}</h3>
                  <p className="strategic-description">{advice.description}</p>
                  {advice.questions && advice.questions.length > 0 && (
                    <div className="strategic-questions">
                      <span className="strategic-questions-label">自問すべき問い</span>
                      <ul>
                        {advice.questions.map((q, j) => (
                          <li key={j}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-outline" onClick={handleReset}>
            もう一度診断する
          </button>
        </>
      )}
    </div>
  )
}
