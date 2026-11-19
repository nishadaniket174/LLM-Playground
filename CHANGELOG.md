# Changelog

All notable changes to the Independent LLM Playground project are documented here.

## [1.0.0] - Initial Release

### Added
- **Multi-Chat Management & History**: Collapsible conversation sidebar with thread history, custom renaming, deletion, and isolated per-chat message contexts.
- **Prompt Editing & Regeneration**: Inline "Edit" button on user messages with prompt re-submission, truncation of subsequent history, and fresh stream generation.
- **Conversation Branching**: "Branch" action on any message to fork the conversation up to that point into a new isolated thread without modifying the parent thread.
- **Context Length / Max Context Control**: Dedicated context window slider in `ConfigurationPanel` mapping to `contextLength` and model architectural bounds.
- **UI Polish & Cleanup**: Cleaned up debug elements, added toggleable side navigation, and improved visual hierarchy.
- **Groq Provider Integration**: Dedicated Groq adapter (`GroqAdapter`) supporting ultra-fast LPU inference (`llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`), live model discovery, and direct key setup via `console.groq.com`.
- **BYOK Architecture**: Secure Bring-Your-Own-Key model supporting session-based in-memory credential storage.
- **Provider Adapters**:
  - `OpenAIAdapter`: Native GPT-4o, o1, GPT-4 Turbo models with SSE streaming and penalty parameters.
  - `GeminiAdapter`: Google Gemini 1.5 Pro, Flash, 2.0 Flash models with Top K, Top P, and system instructions.
  - `AnthropicAdapter`: Claude 3.7 Sonnet, 3.5 Sonnet, 3.5 Haiku, and Opus models with streaming messages API.
  - `OpenAICompatibleAdapter`: Flexible adapter supporting Together AI, Groq, Mistral, OpenRouter, and custom endpoints.
- **LM Studio Inspired Interface**:
  - Clean, dark minimal desktop UI with unified header model & provider selector.
  - Collapsible side configuration inspector for temperature, top P, top K, token bounds, seed, and stop sequences.
  - Streaming markdown-friendly chat message canvas with copy actions and token limit indicators.
  - Real-time generation controls with dedicated "Stop Generation" button via `AbortController`.
- **API & Backend**:
  - `/api/chat`: Server-sent event (SSE) streaming endpoint.
  - `/api/models`: Live model discovery with graceful fallback to curated defaults.
  - `/api/test-connection`: Non-intrusive connection testing.
- **Security & Logging**:
  - Structured JSON logging with automated credential redaction.
  - Zero local storage / persistent file writes for secrets.
- **Developer Documentation**:
  - `README.md`, `CHANGELOG.md`, `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`, `docs/PROVIDERS.md`, `docs/LOGGING.md`.
