# Architecture Documentation

## Overview

The **Independent LLM Playground** is an architectural implementation of a Bring-Your-Own-Key (BYOK) cloud inference environment inspired by the configuration and layout workflow of LM Studio. 

Importantly, this application connects exclusively to cloud AI endpoints via standardized API adapters; it does not host local weights or run local model servers.

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser Client                        │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │     Chat Canvas       │  ◄──► │  Inference Config     │  │
│  │ (Streaming Messages)  │       │ (Temperature, TopP..) │  │
│  └───────────────────────┘       └───────────────────────┘  │
│             ▲                                               │
│             │ In-Memory Session Credentials                 │
│             ▼                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │             API Keys & Provider Dialog                │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST /api/chat (SSE Stream)
                               │ POST /api/models
                               │ POST /api/test-connection
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Next.js Backend                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               Provider Adapter Layer                  │  │
│  │  ┌───────────────┐ ┌───────────────┐ ┌─────────────┐  │  │
│  │  │ OpenAIAdapter │ │ GeminiAdapter │ │  Anthropic  │  │  │
│  │  └───────────────┘ └───────────────┘ └─────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           OpenAI-Compatible Adapter             │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                              │
│                 Structured Logging & Sanitizer              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
              Cloud Inference Endpoints (HTTPS)
   [OpenAI]       [Google Gemini]       [Anthropic]       [Together/Groq/etc.]
```

---

## Core Components

### 1. Provider Adapter Pattern (`src/lib/adapters/`)
All inference interactions conform to a common interface (`ProviderAdapter`):
- `validateCredentials(apiKey, customEndpoint)`: Validates connectivity and auth without mutating state.
- `listModels(apiKey, customEndpoint)`: Discovers models available on the provider or falls back to curated models.
- `createChatStream(request, abortSignal)`: Normalizes provider-specific streaming protocols (OpenAI SSE, Gemini SSE, Anthropic Server-Sent Events) into a consistent `ReadableStream<Uint8Array>` text stream.

Adding a new cloud provider requires creating an adapter class and registering it in `PROVIDERS_METADATA` without touching UI or chat orchestration logic.

### 2. State & Context Management (`src/context/PlaygroundContext.tsx`)
Provides reactive React context for:
- Active provider and selected model.
- Ephemeral in-memory API keys per provider.
- Inference parameters (Temperature, Top P, Top K, Max Output Tokens, penalties, seeds, stop sequences).
- System prompt instructions.
- Chat message histories and active streaming controllers (`AbortController`).

### 3. Security Boundary
- **In-Memory Credentials**: Keys are never written to `localStorage`, cookies, or browser caches.
- **Server-Side Sanitation**: Loggers sanitize tokens, keys, and authorization headers before logging.
- **Client-Side Masking**: Input fields default to masked passwords with optional visibility toggles.
