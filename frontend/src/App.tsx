import { useMemo, useState } from 'react'
import './App.css'

type Operation = 'trim' | 'resize' | 'metadata'

type FormState = {
  apiBase: string
  operation: Operation
  filePath: string
  startTime: string
  duration: string
  width: number
  height: number
  outputName: string
}

const defaultOutputs: Record<Operation, string> = {
  trim: 'trimmed.mp4',
  resize: 'resized.mp4',
  metadata: 'metadata.json'
}

function sanitizeBaseUrl(url: string): string {
  if (!url) return ''
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function buildCurlCommand(state: FormState): string {
  const endpoint = `${sanitizeBaseUrl(state.apiBase)}/api/v1/videos/${state.operation}`
  const lines = [`curl -X POST "${endpoint}"`, `  -F "file=@${state.filePath}"`]

  if (state.operation === 'trim') {
    lines.push(`  -F "start_time=${state.startTime}"`)
    if (state.duration) {
      lines.push(`  -F "duration=${state.duration}"`)
    }
    lines.push(`  --output ${state.outputName || defaultOutputs.trim}`)
  }

  if (state.operation === 'resize') {
    lines.push(`  -F "width=${state.width}"`)
    lines.push(`  -F "height=${state.height}"`)
    lines.push(`  --output ${state.outputName || defaultOutputs.resize}`)
  }

  if (state.operation === 'metadata') {
    lines.push(`  --output ${state.outputName || defaultOutputs.metadata}`)
  }

  return lines.join(' \\\n')
}

export default function App(): JSX.Element {
  const [form, setForm] = useState<FormState>({
    apiBase: 'http://localhost:8000',
    operation: 'trim',
    filePath: '/path/to/video.mp4',
    startTime: '00:00:05',
    duration: '',
    width: 1280,
    height: 720,
    outputName: defaultOutputs.trim
  })

  const [copied, setCopied] = useState(false)

  const curl = useMemo(() => buildCurlCommand(form), [form])

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'operation' ? { outputName: defaultOutputs[value as Operation] } : {})
    }))
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(curl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Clipboard copy failed', error)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Video Editor API</p>
          <h1>Template builder for curl workflows</h1>
          <p className="lede">
            Configure your trim, resize, or metadata requests and instantly generate the curl command you can run
            against the FastAPI service.
          </p>
        </div>
        <div className="badge">React UI</div>
      </header>

      <main className="layout">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Configuration</p>
              <h2>Template inputs</h2>
            </div>
            <span className="pill">Step 1</span>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>API base URL</span>
              <input
                type="text"
                value={form.apiBase}
                onChange={(event) => updateField('apiBase', event.target.value)}
                placeholder="http://localhost:8000"
              />
              <small>Trim the trailing slash if present; we append the route automatically.</small>
            </label>

            <label className="field">
              <span>Source file path</span>
              <input
                type="text"
                value={form.filePath}
                onChange={(event) => updateField('filePath', event.target.value)}
                placeholder="/path/to/video.mp4"
              />
              <small>This path is used by curl to upload your video.</small>
            </label>
          </div>

          <div className="operation-toggle" role="group" aria-label="Select operation">
            {(
              [
                { value: 'trim', label: 'Trim clip' },
                { value: 'resize', label: 'Resize video' },
                { value: 'metadata', label: 'Metadata only' }
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={form.operation === value ? 'active' : ''}
                onClick={() => updateField('operation', value)}
              >
                {label}
              </button>
            ))}
          </div>

          {form.operation === 'trim' && (
            <div className="field-grid">
              <label className="field">
                <span>Start time</span>
                <input
                  type="text"
                  value={form.startTime}
                  onChange={(event) => updateField('startTime', event.target.value)}
                  placeholder="00:00:05"
                />
                <small>Timestamp to begin trimming (HH:MM:SS).</small>
              </label>
              <label className="field">
                <span>Duration (optional)</span>
                <input
                  type="text"
                  value={form.duration}
                  onChange={(event) => updateField('duration', event.target.value)}
                  placeholder="3"
                />
                <small>Length in seconds; leave blank to include the rest of the file.</small>
              </label>
            </div>
          )}

          {form.operation === 'resize' && (
            <div className="field-grid">
              <label className="field">
                <span>Width</span>
                <input
                  type="number"
                  value={form.width}
                  min={1}
                  onChange={(event) => updateField('width', Number(event.target.value) || 0)}
                />
                <small>Target width in pixels.</small>
              </label>
              <label className="field">
                <span>Height</span>
                <input
                  type="number"
                  value={form.height}
                  min={1}
                  onChange={(event) => updateField('height', Number(event.target.value) || 0)}
                />
                <small>Target height in pixels.</small>
              </label>
            </div>
          )}

          <label className="field">
            <span>Output file name</span>
            <input
              type="text"
              value={form.outputName}
              onChange={(event) => updateField('outputName', event.target.value)}
              placeholder={defaultOutputs[form.operation]}
            />
            <small>Used for the local file written by the curl command.</small>
          </label>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Template result</p>
              <h2>Generated curl</h2>
            </div>
            <span className="pill">Step 2</span>
          </div>

          <div className="summary">
            <div>
              <p className="summary-label">Endpoint</p>
              <p className="summary-value">
                {sanitizeBaseUrl(form.apiBase)}/api/v1/videos/{form.operation}
              </p>
            </div>
            <div className="chip">{form.operation}</div>
          </div>

          <div className="code-block">
            <pre>{curl}</pre>
          </div>

          <div className="actions">
            <button type="button" onClick={onCopy}>{copied ? 'Copied!' : 'Copy command'}</button>
            <p className="helper">Paste this into your terminal to run the request.</p>
          </div>

          <div className="hint-grid">
            <div>
              <p className="hint-title">Tip</p>
              <p className="hint-body">
                Make sure the FastAPI server is running and FFmpeg is available on your system path before executing the
                generated command.
              </p>
            </div>
            <div>
              <p className="hint-title">Need metadata only?</p>
              <p className="hint-body">Select the metadata template to skip processing and return ffprobe details.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
