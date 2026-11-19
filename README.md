# Independent LLM Playground

A clean, functional, and provider-agnostic LLM Playground inspired by the user interface and configuration experience of **LM Studio**.

> **Note:** This is an independent cloud-inference playground based on a **Bring Your Own Key (BYOK)** architecture. It connects directly to cloud AI provider APIs. It does **not** download, host, or require local model weights or local inference servers (e.g. Ollama or LM Studio).

---

## Key Features

- **Bring Your Own Key (BYOK)**: Connect your own API keys in a clean, secure session-based interface.
- **Multi-Provider Support**:
  - **OpenAI**: GPT-4o, GPT-4o mini, o1, GPT-4 Turbo.
  - **Groq**: Ultra-fast LPU inference (Llama 3.3 70B, DeepSeek R1 Distill, Mixtral 8x7B, Gemma 2 9B).
  - **Google Gemini**: Gemini 1.5 Pro, 1.5 Flash, 2.0 Flash.
  - **Anthropic**: Claude 3.7 Sonnet, Claude 3.5 Sonnet, Claude 3.5 Haiku.
  - **OpenAI Compatible**: Together AI, Groq, Mistral, OpenRouter, or any custom endpoint.
- **LM Studio Configuration Experience**:
  - Unified model and provider selector in the header.
  - Real-time parameter inspector: Temperature, Top P, Top K, Max Output Tokens.
  - Advanced generation parameters: Frequency penalty, Presence penalty, Random seed, Stop sequences, Streaming toggle.
  - Clear architectural distinction between model context window limits and maximum output generation limits.
- **Fast Streaming Chat**:
  - Live token streaming with stop generation support.
  - Quick conversation controls: New Chat, Clear History, Copy Message.
  - System prompt editor.
- **Provider Connection Tester & Model Discovery**:
  - Validate credentials with a single click.
  - Dynamic model discovery from provider endpoints with fallback to curated defaults.
- **Security-First Architecture**:
  - In-memory session keys: no persistence in `localStorage` or unencrypted disks.
  - Structured application logger with automatic credential redaction.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## Documentation

Detailed documentation is available in the `docs/` folder:

- [Architecture & Design](docs/ARCHITECTURE.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Supported Providers & Capabilities](docs/PROVIDERS.md)
- [Structured Logging Guide](docs/LOGGING.md)
- [Changelog](CHANGELOG.md)

---

## License

MIT
