export type QwenScenarioInput = {
  scenario: string
  customer: string
  tool: string
  toolEvidence: readonly string[]
}

export type QwenDraft = {
  configured: boolean
  live: boolean
  model: string
  baseUrl: string
  answer?: string
  error?: string
}

const defaultBaseUrl = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
const defaultModel = 'qwen3.7-plus'

function qwenConfig() {
  const apiKey = process.env.QWEN_CLOUD_API_KEY || process.env.DASHSCOPE_API_KEY || ''
  const baseUrl = (process.env.QWEN_CLOUD_BASE_URL || defaultBaseUrl).replace(/\/+$/, '')
  const model = process.env.QWEN_CLOUD_MODEL || defaultModel

  return { apiKey, baseUrl, model }
}

export function qwenRuntimeEvidence() {
  const { apiKey, baseUrl, model } = qwenConfig()

  return {
    provider: 'qwen-cloud',
    configured: Boolean(apiKey),
    baseUrl,
    model,
    modelRef: `qwen-cloud/${model}`,
    requiredEnv: ['QWEN_CLOUD_API_KEY', 'QWEN_CLOUD_BASE_URL', 'QWEN_CLOUD_MODEL'],
  }
}

export async function draftWithQwen(input: QwenScenarioInput): Promise<QwenDraft> {
  const { apiKey, baseUrl, model } = qwenConfig()
  if (!apiKey) {
    return {
      configured: false,
      live: false,
      model,
      baseUrl,
      error: 'QWEN_CLOUD_API_KEY or DASHSCOPE_API_KEY is not configured.',
    }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are Huyen, a Vietnamese SME support autopilot. Answer in natural Vietnamese without inventing facts. Use only the provided tool evidence.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              scenario: input.scenario,
              customer_message: input.customer,
              tool_used: input.tool,
              tool_evidence: input.toolEvidence,
            }),
          },
        ],
        temperature: 0.2,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string } }>
      error?: { message?: string }
    }

    if (!response.ok) {
      return {
        configured: true,
        live: false,
        model,
        baseUrl,
        error: payload.error?.message || `Qwen Cloud request failed with status ${response.status}.`,
      }
    }

    const answer = payload.choices?.[0]?.message?.content?.trim()
    return {
      configured: true,
      live: Boolean(answer),
      model,
      baseUrl,
      answer,
      error: answer ? undefined : 'Qwen Cloud returned an empty completion.',
    }
  } catch (error) {
    return {
      configured: true,
      live: false,
      model,
      baseUrl,
      error: error instanceof Error ? error.message : 'Qwen Cloud request failed.',
    }
  } finally {
    clearTimeout(timeout)
  }
}
