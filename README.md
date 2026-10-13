# FlowMesh AI
> **"Speak once. Let AI coordinate the work."**

An autonomous collaborative multi-agent workflow platform built for the official hackathon track: **Collaborative Multi-Agent Workflows** at *"Stop Prompting. The Dawn of the Autonomous AI Builder"*.

FlowMesh AI eliminates conversational prompting ping-pong by transforming a single, natural voice instruction into an observable, self-correcting team of specialized autonomous agents backed by **Qdrant** vector memory, **Lyzr** multi-agent orchestration, and **Omi** wearable audio streams.

- **GitHub Repository:** [https://github.com/morepriyo-dotcom/collaborative-multi-agent-workflows](https://github.com/morepriyo-dotcom/collaborative-multi-agent-workflows)
- **Live Deployment:** [https://collaborative-multi-agent-workflows-one.vercel.app/](https://collaborative-multi-agent-workflows-one.vercel.app/)

---

## 🏆 Hackathon Track Alignment

- **Official Track:** Collaborative Multi-Agent Workflows
- **Track Definition:** *"Voice-triggered execution pipelines where specialized agents coordinate using a shared vector memory layer."*
- **Evaluation Weights:** Working software and observable agentic workflows weigh **60%+ of the total score**.
- **Mandatory Integrations:** **Omi** (Voice Wearable/API) + **Qdrant** (Vector Database) + **Lyzr** (Agent Orchestration).
- **Format:** Solo entry. Max 5-minute video demonstration. Submission portal: `app.hidevs.xyz`.

---

## 💡 The Problem vs The Solution

### The Chatbot Fallacy
Today's "AI wrappers" require users to repeatedly prompt, copy-paste outputs between multiple tabs, remind models of past mistakes, manually route information between tools, and act as a human router:
> *"Now search this..."* → *"Now remember what I told you last week..."* → *"Now make a plan..."* → *"Wait, you forgot the 5-minute video limit, please revise..."*

### The FlowMesh Paradigm: Delegated Autonomy
A user states their overarching goal **once**:
> *"Help me prepare for my upcoming AI hackathon. Remember my previous project experience, research what I need to prepare, identify my weak areas, create a prioritized preparation plan, and check whether the plan covers everything."*

FlowMesh AI autonomously coordinates:
1. **Captures Voice Input:** Transcribes audio via Omi wearable webhook or Browser Web Speech API.
2. **Dynamic Intent Deconstruction:** Extracts objectives, explicit constraints, priority, and required deliverables.
3. **Semantic Vector Retrieval (Qdrant):** Retrieves historical project lessons, preferences, and pitfall patterns.
4. **Dynamic DAG Orchestration (Lyzr):** Compiles an execution DAG identifying parallel workers vs sequential stages.
5. **Parallel Fan-Out:** Executes **Domain Research** and **Capability/Risk Analysis** concurrently.
6. **Execution Roadmap Synthesis:** Drafts a phased P0/P1 implementation plan and actionable checklist.
7. **Critic Verification Loop:** Audits deliverables against success criteria. Detects missing elements, triggers a **Draft → Critic → Revision → Approved** cycle.
8. **Consolidation & Cross-Task Persistence:** Synthesizes final deliverables and embeds newly discovered knowledge vectors into **Qdrant** for future sessions.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Voice_Layer["🎙️ Voice Layer (Omi / Browser Dev)"]
        A["User Voice Request"] --> B["Omi Wearable Webhook (/api/omi/webhook)"]
        A --> B2["Browser Web Speech API (Local Dev)"]
        B & B2 --> C["Intent Agent"]
    end

    subgraph Memory_Layer["🧠 Shared Vector Memory Layer (Qdrant)"]
        D[("Qdrant Vector DB<br/>collection: flowmesh_memories<br/>768-dim Cosine Embeddings")]
        E["Memory Agent<br/>(Semantic Vector Search)"]
        D <-->|Vector Retrieval & Upsert| E
    end

    subgraph Orchestration_Layer["⚡ Lyzr Multi-Agent Orchestration"]
        C --> F["Planner Agent<br/>(DAG Compiler)"]
        
        F --> G["Research Agent<br/>(Track Rules & Scoring Breakdown)"]
        F --> E
        
        G & E --> H["Skill & Risk Analysis Agent<br/>(Vulnerability & Guardrail Analysis)"]
        
        G & E & H --> I["Executor Agent<br/>(Draft Phased Roadmap & Checklist)"]
        
        I --> J{"Critic Agent<br/>(Verification & Quality Audit)"}
        
        J -- "Gaps Detected (Score 79%)" --> K["Self-Correction Revision Directive"]
        K --> I
        
        J -- "Approved (Score 97%)" --> L["Final Synthesizer"]
    end

    subgraph Outcome_Layer["📊 Real-Time Observability & Persistence"]
        L --> M["Consolidated Executive Plan & Checklist"]
        L -->|Upsert New Knowledge Vectors| D
        C & F & G & E & H & I & J & L -.->|SSE Stream (/api/workflow/stream)| N["Animated DAG Visualizer & Live Event Stream"]
    end
```

---

## 🤖 The 7 Specialized Agents

Each agent has a concrete, strictly segregated responsibility:

| Agent | Name | Role & Responsibility |
|---|---|---|
| **1. Intent Agent** | `FlowMesh-Intent-Analyst` | Deconstructs unstructured voice into goal, domain, explicit constraints, priority, and required deliverables. |
| **2. Planner Agent** | `FlowMesh-DAG-Orchestrator` | Compiles dependency DAG, scheduling parallel fan-out (Research & Memory) to minimize latency before action drafting. |
| **3. Memory Agent** | `FlowMesh-Qdrant-Context-Synthesizer` | Conducts semantic vector search over Qdrant, retrieving historical project experiences, preferences, and pitfall patterns. |
| **4. Research Agent** | `FlowMesh-Domain-Researcher` | Analyzes track specifications, official hackathon judging weights (60%+ software & observability), and solo rules. |
| **5. Analysis Agent** | `FlowMesh-Capability-Assessor` | Evaluates user weaknesses (e.g., historical demo video length overflow) and formulates concrete risk mitigations. |
| **6. Executor Agent** | `FlowMesh-Action-Planner` | Synthesizes research and memory findings into a 4-phase P0/P1/P2 master implementation roadmap. |
| **7. Critic Agent** | `FlowMesh-Quality-Verifier` | Rigorously audits executor drafts against initial constraints. Issues revision directives if gaps exist (`Draft -> Critic -> Revision -> Approved`). |
| **8. Synthesizer Agent** | `FlowMesh-Final-Consolidator` | Consolidates all agent deliverables and embeds newly discovered insights back into Qdrant vector memory. |

---

## 🔗 The Mandatory Trinity Integrations

### 1. Omi Integration (`/lib/omi/`, `/app/api/omi/`)
- **Webhook Endpoint:** `/api/omi/webhook` handles Omi wearable memory triggers, real-time speech segments, and device heartbeats.
- **Truthful Telemetry:** If an active Omi webhook or `OMI_API_KEY` is present, displays **"Omi Connected"** with battery level and device ID. When operating without wearable hardware, it displays **"Browser Voice — Dev Mode"** (never faking hardware status).
- **Interactive Simulator:** The UI includes an **"Simulate Omi Webhook Ingestion"** button, allowing evaluators to simulate real wearable packet reception with zero hardware setup.

### 2. Qdrant Integration (`/lib/qdrant/`, `/app/api/memory/`)
- **SDK:** Official `@qdrant/js-client-rest` client with `collectionExists`, `createCollection`, `upsert`, and `query` methods.
- **Collection:** `flowmesh_memories` with 768-dimensional normalized vectors and cosine distance indexing.
- **Dual Engine Architecture:** Works seamlessly with Qdrant Cloud or local instances, and falls back to an embedded high-dimensional cosine similarity engine when cloud credentials are unconfigured.
- **Memory Explorer:** A visual tab allowing users to inspect stored vectors, perform semantic similarity queries, and add new memories.

### 3. Lyzr Integration (`/lib/lyzr/`)
- **REST Client:** Targets production Lyzr Agent Studio v3 endpoints (`https://agent-prod.studio.lyzr.ai/v3/`).
- **Agent Factory:** Manages individual specialized agents with custom system instructions and roles.
- **Dynamic Reasoning Engine:** When external LLM credentials are unconfigured, a dynamic NLP reasoning engine (`lib/agents/dynamicReasoner.ts`) executes full semantic deconstruction, DAG generation, risk assessment, and genuine criteria-based auditing without hardcoded outputs.

---

## 📡 Live Observability & Human-in-the-Loop Governance

### Real-Time Server-Sent Events (SSE)
FlowMesh AI uses **Server-Sent Events** via `/api/workflow/stream` to stream live agent state transitions directly to the browser:
- Watch the **SVG DAG graph** light up node by node in real time: `Waiting` → `Running` → `Revising` → `Done`.
- Inspect millisecond-timestamped telemetry logs as each agent completes handoffs.

### Human Control Bar
- **Pause / Resume Workflow:** Instantly freeze execution between agent handoffs.
- **Selective Stage Retry:** Click any node (e.g. *Critic Agent*) and trigger `Retry Critic Stage` to re-execute downstream stages while preserving upstream outputs.
- **Cancel:** Graceful workflow abort via client-side `AbortController` and backend `AbortSignal`.
- **Approve Memory Persist:** Operator confirmation gate before newly synthesized learnings are committed to vector storage.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v24.19.0)
- npm 9+

### 1. Clone & Install
```bash
git clone https://github.com/morepriyo-dotcom/collaborative-multi-agent-workflows.git
cd collaborative-multi-agent-workflows
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate the required credentials:
```ini
# Lyzr Agent Studio API (Optional: runs in Lyzr Autonomous Orchestrator if omitted)
LYZR_API_KEY=your_lyzr_api_key_here

# Qdrant Vector Database (Cloud or Local http://localhost:6333)
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key_here
QDRANT_COLLECTION_NAME=flowmesh_memories

# Omi Wearable / Developer API
OMI_API_KEY=your_omi_api_key_here
OMI_WEBHOOK_SECRET=your_omi_webhook_secret_here

# AI Model Provider (Optional: Gemini / OpenAI)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Automated Verification Tests
```bash
npm test
```
Runs the 24-step verification suite validating multi-domain intent parsing, Qdrant multi-turn persistence, Critic revision loops, and cancellation signals.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 🎥 5-Minute Hackathon Demo Script (< 4:30 Target)

| Timecode | Phase | Script & Visual Actions |
|---|---|---|
| **0:00 – 0:40** | **The Hook & Problem** | - Open on FlowMesh AI home screen.<br>- "Stop prompting. Start delegating." Explain why chatbots fail in collaborative workflows (human copy-pasting, context loss).<br>- Introduce the Hackathon Track: *Collaborative Multi-Agent Workflows*. |
| **0:40 – 1:30** | **Voice Ingestion & Memory** | - Highlight top telemetry badges (honest status for Omi, Qdrant, Lyzr).<br>- Switch to **Memory Explorer**: show historical memory vectors (prior 2025 hackathon pitfall: demo video exceeded 5-min limit).<br>- Click **"Simulate Omi Webhook Ingestion"** or speak the official prompt. Show transcript populate into the editable text area. |
| **1:30 – 2:30** | **Autonomous DAG Execution** | - Click **"Start Autonomous Workflow"**.<br>- Observe live SSE streaming: Intent Agent deconstructs goals and constraints.<br>- Watch parallel fan-out: Memory Agent retrieves vectors from Qdrant while Research Agent analyzes 60% scoring criteria.<br>- Skill Analysis Agent synthesizes risk mitigations. Executor drafts initial 4-phase plan. |
| **2:30 – 3:30** | **Critic Verification & Self-Correction** | - Highlight the Critic node turning amber (`Revising`).<br>- Show the Critic audit score (79/100): "Missing explicit 4:30 video timecode guardrail to address user historical pitfall."<br>- Watch the Executor apply Critic directives in real time.<br>- Second Critic audit approves with score 97/100 (`Draft -> Critic -> Revision -> Approved`). |
| **3:30 – 4:15** | **Final Deliverables & Governance** | - Scroll to **Final Consolidated Deliverables**.<br>- Show interactive P0/P1 checklist items.<br>- Click **"Approve Memory Persist"** to commit newly discovered vectors into Qdrant.<br>- Demonstrate **Human Control Bar**: Pause, Resume, Stage Retry, Cancel. |
| **4:15 – 4:30** | **Conclusion & Scoring Summary** | - Summarize: End-to-end voice-to-memory-to-agent loop complete.<br>- 100% working software, verifiable Trinity integrations, finished safely under 4:30! |

---

## 📜 License & Acknowledgments

Built for the **"Stop Prompting. The Dawn of the Autonomous AI Builder"** Hackathon (Submission deadline: October 13, 2026).
- **Track:** Collaborative Multi-Agent Workflows
- **Powered by:** Omi, Qdrant, Lyzr
