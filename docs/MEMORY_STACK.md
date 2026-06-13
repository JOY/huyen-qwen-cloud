# Memory Stack Decision - mem0 + a custom layer (READ THIS for the memory design)

> Decided 2026-06-13. This **overrides the hand-rolled store/episodic design** in
> `implementation-plan.md`: use **mem0** (mem0ai, Apache-2.0) as the memory substrate, wrapped by a
> thin custom layer. The pure logic in `huyen/ranking.py`, the `customer_profile`/`knowledge`/
> `handoffs` tables, and the AgentScope agent layer (`AGENTSCOPE_API.md`) are unchanged.

## Why mem0 (and why not the others)

- **mem0 - CHOSEN.** Apache-2.0. Plugs into **DashScope for BOTH the LLM and the embeddings** via
  `openai_base_url` (verified in mem0 docs). Self-hosts on **pgvector only** (matches our scaffold,
  no extra DB). Has built-in Ebbinghaus-style memory decay. ~48k stars, active.
- **honcho - REJECTED.** AGPL-3.0 - copyleft that would force our **public** repo to AGPL.
  Dealbreaker. (Also: custom-embedding support was still unconfirmed.)
- **Graphiti (Zep) - STRETCH only.** Apache-2.0 and the strongest on *temporal* forgetting
  (bi-temporal knowledge graph: facts get `valid_at`/`expired_at`, answers "what was their address
  before they moved"). But it needs an extra graph DB (Neo4j/FalkorDB) on ECS and the docs warn
  weaker models may emit invalid JSON for graph construction (test with Qwen first). Optional
  Phase-7 enhancement, NOT the MVP.
- **Hand-rolled (original plan)** = most custom but slowest/buggiest for a handoff build.

## mem0 + DashScope config (confirm exact field names against the installed mem0 version)

```python
import os
from mem0 import Memory

config = {
    "llm": {"provider": "openai", "config": {
        "model": os.environ["QWEN_CHAT_MODEL"],            # e.g. qwen-plus / qwen3.6-plus
        "api_key": os.environ["DASHSCOPE_API_KEY"],
        "openai_base_url": os.environ["DASHSCOPE_BASE_URL"]}},
    "embedder": {"provider": "openai", "config": {
        "model": os.environ["QWEN_EMBED_MODEL"],           # text-embedding-v4
        "api_key": os.environ["DASHSCOPE_API_KEY"],
        "openai_base_url": os.environ["DASHSCOPE_BASE_URL"],
        "embedding_dims": int(os.environ["EMBED_DIM"])}},   # CONFIRM key name (embedding_dims vs dimensions)
    "vector_store": {"provider": "pgvector", "config": {     # CONFIRM pgvector config keys
        "dbname": "huyen", "user": "huyen", "password": "huyen",
        "host": "localhost", "port": 5432}},
}
m = Memory.from_config(config)
m.add(messages, user_id=customer_id)               # per-customer episodic write
hits = m.search(query, user_id=customer_id, limit=K)   # per-customer recall
```
Confirm against `docs.mem0.ai/components/llms/config`, `.../embedders/config`, and the pgvector
vector-store config page for the installed version. Verify mem0 actually routes embeddings through
DashScope (log one request) - this is the hackathon's hard requirement.

## How it wires into AgentScope (agent layer unchanged - see AGENTSCOPE_API.md)

`huyen/memory_service.py` becomes a thin wrapper over mem0 PLUS our custom layer:

- `async recall(customer_id, query) -> str`: `m.search(query, user_id=customer_id, limit=K)` for
  episodic memories, PLUS our structured **profile** (always included), composed into a compact
  limited-context block. Reuse `ranking.py` (`rank_episodes` semantic+recency blend, `merge_profile`).
  Inject the block via `await agent.observe(Msg(... role="system"))` before `agent.reply(...)`.
- `async record(customer_id, user_text, assistant_text)`: `m.add(...)` for episodic; ALSO run our
  durable-profile extractor (LLM -> facts, conflict-overwrite into `customer_profile`). We keep an
  explicit profile table for the demo's profile panel and for deterministic recall.
- `async consolidate(customer_id)`: our forgetting/pruning policy layered on mem0's decay.

**Schema note:** mem0's pgvector store creates and owns its OWN episodic table. So in `db/schema.sql`
you can drop the hand-rolled `episodic_memory` table (let mem0 own episodic) and KEEP
`customer_profile`, `knowledge`, `handoffs` as ours. Decide at build time; simplest = mem0 owns episodic.

## What stays custom (this is where the Innovation / Technical-Depth points come from)

1. Structured per-customer **profile** with conflict-overwrite (richer than mem0's flat fact list).
2. **Recall composition**: profile (always) + top-K mem0 episodic re-ranked by our semantic+recency
   blend into a compact, limited-context block - directly targets the track's "recall in limited context".
3. **Forgetting/consolidation** policy on top of mem0.
4. The **memory side-panel** in the web UI showing exactly what was recalled each turn (great demo).
5. **Qwen-native** wiring: DashScope drives mem0's LLM + embeddings AND the AgentScope agent.

## Knowledge base stays separate

mem0 is per-customer MEMORY, NOT the shop FAQ. Keep the `knowledge` table + pgvector RAG (DashScope
`text-embedding-v4`) for the `knowledge_search` tool exactly as the plan describes.
