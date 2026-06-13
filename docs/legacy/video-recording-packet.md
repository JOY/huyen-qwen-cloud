# Huyen Video Recording Packet

Use this packet to record the required public demo video. Target length: 2:45 to 3:00.

## Recording Setup

- Browser: open the deployed Huyen URL. Local fallback for rehearsal: `http://localhost:3010`.
- Terminal tab: ready to run `scripts/smoke-scenarios.ps1`.
- Repo tab: `https://github.com/JOY/huyen-qwen-cloud`.
- Optional proof tab: Alibaba Cloud runtime console or deployment proof recording.
- Output: public YouTube, Vimeo, or Facebook Video URL.

## Timeline

| Time | Screen | Narration |
| --- | --- | --- |
| 0:00-0:15 | Huyen landing screen | "Huyen is a Qwen-powered support autopilot for Vietnamese SMEs, spun out from DOSClaw as its own hackathon product." |
| 0:15-0:35 | Architecture or repo README | "The runtime is OpenClaw. DOSClaw provides memory, knowledge, and handoff tools. Qwen Cloud is the primary reasoning path." |
| 0:35-1:05 | Returning customer scenario | "First, Huyen handles a returning customer. It uses memory to recall Minh's same-day delivery preference without asking again." |
| 1:05-1:35 | Policy question scenario | "Second, Huyen answers warranty and return policy only after knowledge lookup, so it does not guess business facts." |
| 1:35-2:05 | Human handoff scenario | "Third, Huyen escalates a risky complaint. It only confirms staff handoff after the handoff tool succeeds." |
| 2:05-2:30 | Smoke proof terminal | "The smoke script checks health, all three scenarios, Qwen model evidence, tool evidence, and answer source." |
| 2:30-2:50 | Repo docs or evidence package | "The public repo includes the live Qwen adapter, architecture, deployment proof checklist, and evidence package." |
| 2:50-3:00 | Closing screen | "This is not a generic chatbot. It is a production-shaped customer support autopilot: memory, knowledge, Qwen reasoning, and honest escalation." |

## Click Path

1. Start on `/`.
2. Click `Returning customer`.
3. Click `Policy question`.
4. Click `Human handoff`.
5. Open `/api/demo` briefly if you want to show the JSON contract.
6. Show the smoke proof:

```powershell
$env:HUYEN_URL = "https://<public-demo-domain>"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/smoke-scenarios.ps1
```

## Required Lines to Show or Say

- "Qwen Cloud is used through the OpenAI-compatible Chat Completions endpoint."
- "The demo API has a live Qwen Cloud path when `QWEN_CLOUD_API_KEY` or `DASHSCOPE_API_KEY` is configured."
- "The public repository remains runnable without secrets through a synthetic fallback."
- "The handoff flow is honest: Huyen does not claim a human was notified until the tool succeeds."

## Post-Recording Checklist

- [ ] Video is public or unlisted-publicly-viewable.
- [ ] Video URL is added to `docs/devpost-draft.md`.
- [ ] Video URL is added to `docs/judging-packet.md`.
- [ ] Alibaba proof recording URL is added separately if required.
- [ ] `scripts/smoke-scenarios.ps1` evidence JSON is included in `docs/proof/`.
- [ ] `scripts/package-submission.ps1` is rerun after adding URLs.

## Optional B-roll

- Show `src/lib/qwen.ts` for the live Qwen Cloud adapter.
- Show `docs/architecture.mmd` for system structure.
- Show `docs/alibaba-ram-policy-huyen-deploy.json` if explaining the current deployment permission gate.
