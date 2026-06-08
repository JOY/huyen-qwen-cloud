import { NextRequest, NextResponse } from 'next/server'
import { draftWithQwen, qwenRuntimeEvidence } from '@/lib/qwen'

const scenarios = {
  memory: {
    user: 'Minh asks if same-day delivery is available today.',
    qwenTask: 'Reason over a returning customer request.',
    tools: ['search_memory'],
    toolEvidence: ['Minh is a returning customer.', 'Minh prefers same-day delivery in Ho Chi Minh City.', 'Same-day cutoff is 5pm.'],
    answer:
      'Huyen recalls that Minh prefers same-day delivery in Ho Chi Minh City, then confirms the availability window without asking again.',
  },
  knowledge: {
    user: 'A customer asks about warranty and return policy.',
    qwenTask: 'Draft a grounded policy answer after tool evidence.',
    tools: ['search_knowledge'],
    toolEvidence: ['Warranty is 12 months for manufacturing defects.', 'Unused items can be returned within 7 days with original packaging.'],
    answer:
      'Huyen searches the business FAQ first, then answers with the 12-month warranty and 7-day unused return policy.',
  },
  handoff: {
    user: 'A customer says the product failed twice and asks for staff or a refund.',
    qwenTask: 'Classify escalation risk and prepare a concise case summary.',
    tools: ['handoff_to_human'],
    toolEvidence: ['Customer reports the second product failure.', 'Customer asks for staff or refund.', 'Human handoff tool accepted the case summary.'],
    answer:
      'Huyen calls the handoff tool with the customer ask, issue summary, and reason, then confirms only after the tool succeeds.',
  },
} as const

export function GET() {
  return NextResponse.json({
    product: 'Huyen',
    runtime: 'OpenClaw orchestrated by DOSClaw',
    modelProvider: 'Qwen Cloud',
    endpointEnv: 'QWEN_CLOUD_BASE_URL',
    qwen: qwenRuntimeEvidence(),
    scenarios,
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { scenario?: string }
  const key = body.scenario && body.scenario in scenarios ? body.scenario : 'memory'
  const scenario = scenarios[key as keyof typeof scenarios]
  const qwen = await draftWithQwen({
    scenario: key,
    customer: scenario.user,
    tool: scenario.tools[0],
    toolEvidence: scenario.toolEvidence,
  })

  return NextResponse.json({
    ok: true,
    scenario: key,
    result: {
      ...scenario,
      liveQwenAnswer: qwen.answer,
      answerSource: qwen.live ? 'qwen-cloud-live' : 'synthetic-fallback',
    },
    evidence: {
      ...qwenRuntimeEvidence(),
      liveQwen: qwen.live,
      qwenConfigured: qwen.configured,
      qwenError: qwen.error,
      mcpTools: scenario.tools,
    },
  })
}
