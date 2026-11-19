# Engineering Development & Mutation Audit Log

This document records chronological, detailed engineering events, architecture changes, file modifications, and system states across the codebase.

---

## [2026-11-19 20:20:00] - Comprehensive Changelog & Feature Audit

### 1. Architectural Changes
* **Session & State Machine Upgrade**:
  * Migrated from a single flat message array (`ChatMessage[]`) to a relational conversation graph (`Conversation[]` keyed by `id`).
  * Isolated conversation contexts: Switching active conversation via `currentChatId` loads only its associated messages while preserving generation parameters.
  * Added non-destructive branching (`branchConversation`): Copies history up to the target turn and clones state into a new conversation thread marked `(Branch)`.
  * Added prompt rewind & regeneration (`editAndRegenerate`): Truncates downstream chat turns from the target user message, applies new prompt content, and initiates fresh streaming.

* **Inference Context Expansion**:
  * Extended `GenerationParams` with `contextLength` (default `8192` tokens).
  * Tied UI bounds to `activeModelInfo.contextWindow` (up to 131,072 tokens) to distinguish physical hardware bounds from client-configured limits.

### 2. Files Modified & Exact Mutation Details

#### A. Data Models & Typings
* **File**: `src/types/index.ts`
  * Added `ProviderId` union value `'groq'`.
  * Defined `Conversation` interface:
    ```typescript
    export interface Conversation {
      id: string;
      title: string;
      messages: ChatMessage[];
      createdAt: number;
      updatedAt: number;
      provider: ProviderId;
      model: string;
    }
    ```
  * Added `contextLength?: number` to `GenerationParams`.

#### B. Provider Adapter Layer
* **File**: `src/lib/adapters/groq.ts` *(Created)*
  * Built `GroqAdapter` implementing `ProviderAdapter` with base URL `https://api.groq.com/openai/v1`.
  * Configured models: `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `deepseek-r1-distill-llama-70b`, `mixtral-8x7b-32768`, `gemma2-9b-it`.
  * Integrated SSE parser forwarding text deltas to `ReadableStream<Uint8Array>`.
* **File**: `src/lib/adapters/index.ts`
  * Registered `GroqAdapter` into global provider registry `adapters` and `PROVIDERS_METADATA`.
* **File**: `src/lib/logger/index.ts`
  * Added automated pattern redaction for Groq API keys (`/gsk_[a-zA-Z0-9_\-]{20,}/i`).

#### C. State & Context Engine
* **File**: `src/context/PlaygroundContext.tsx`
  * Added multi-chat states: `conversations`, `currentChatId`, `createConversation`, `selectConversation`, `renameConversation`, `deleteConversation`.
  * Implemented `editAndRegenerate(messageId, updatedContent)`: aborts ongoing streams, slices message history to the edit index, appends new assistant placeholder, and runs stream.
  * Implemented `branchConversation(upToMessageId)`: duplicates history up to message ID into a new conversation record.
  * Fixed prerender hydration compatibility by assigning deterministic initial timestamp literals (`0`) during static SSR pass.

#### D. User Interface Components
* **File**: `src/components/chat/ChatSidebar.tsx` *(Created)*
  * Built collapsible sidebar with conversation thread listing.
  * Added inline title editing with commit (`Enter`/check) and discard (`Escape`/cancel).
  * Added conversation deletion and active streaming status indicator.
* **File**: `src/components/chat/ChatMessagesList.tsx`
  * Added hover action toolbar to all messages.
  * Implemented "Edit" button for user messages with inline textarea, "Save & Resend", and "Cancel".
  * Implemented "Branch" button for user and assistant messages.
* **File**: `src/components/config/ConfigurationPanel.tsx`
  * Added **Context Length (Max Context)** slider directly above Max Output Tokens.
  * Dynamically shows hardware context limits and allows tuning from 1,024 to 131,072 tokens.
* **File**: `src/components/chat/PlaygroundHeader.tsx`
  * Added toggle button (`PanelLeft` / `PanelLeftClose`) to show/hide the conversation history sidebar.
* **File**: `src/app/page.tsx`
  * Structured 3-column desktop layout: `ChatSidebar` (Left) | `Chat Canvas` (Center) | `ConfigurationPanel` (Right).
* **File**: `src/components/keys/ApiKeysModal.tsx`
  * Added Groq credentials tab, placeholder `gsk_...`, and direct link to `console.groq.com/keys`.

#### E. Documentation
* **Files**: `CHANGELOG.md`, `README.md`, `docs/PROVIDERS.md`, `docs/LOGGING.md`, `docs/CHANGES_LOG.md`
  * Documented all providers, parameter matrices, logging rules, and change events.

---

## Current Build & Validation State
* **Compiler**: Next.js 16.4.6 (Turbopack)
* **TypeScript**: Strict type checking passed (`npm run build` exit code 0)
* **Status**: Clean, production ready.
