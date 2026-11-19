# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm 9+

### Installation & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

### Adding a New Provider Adapter

To add a new provider (e.g., Mistral, Cohere):
1. Create `src/lib/adapters/<provider-name>.ts` implementing `ProviderAdapter` from `./base`.
2. Implement `validateCredentials`, `listModels`, and `createChatStream`.
3. Register the new adapter instance in `src/lib/adapters/index.ts` and add metadata into `PROVIDERS_METADATA`.
4. Update `ProviderId` union in `src/types/index.ts`.

### Project Layout
```
├── docs/                 # Documentation (Architecture, Providers, Logging, Dev)
├── src/
│   ├── app/              # Next.js App Router (pages & API routes)
│   │   ├── api/
│   │   │   ├── chat/     # Streaming chat completion handler
│   │   │   ├── models/   # Model discovery endpoint
│   │   │   └── test-connection/ # Credential validation endpoint
│   │   └── page.tsx      # Main application entry point
│   ├── components/       # Modular UI components
│   │   ├── chat/         # Chat messages, input bar, top bar
│   │   ├── config/       # LM Studio style parameter inspector
│   │   └── keys/         # BYOK provider & key management modal
│   ├── context/          # Playground React Context
│   ├── lib/
│   │   ├── adapters/     # Provider adapters (OpenAI, Gemini, Anthropic, Custom)
│   │   └── logger/       # Structured, credential-safe logger
│   └── types/            # TypeScript interfaces & types
```
