# Structured Logging Guide

The LLM Playground implements structured JSON logging to monitor application lifecycle, provider interactions, and model discovery without violating security principles.

## Security Principles

1. **Zero Secret Leakage**:
   - Authorization headers, bearer tokens, and API key query strings are stripped or redacted automatically.
   - Any log payload containing keys matching patterns like `sk-...` or `AIza...` is replaced with `[REDACTED_API_KEY]`.
2. **Normalized Severity**:
   - `DEBUG`: Verbose request parameters during development.
   - `INFO`: Normal operational milestones (e.g., chat stream initialized, model listing queried).
   - `WARN`: Provider fallback events (e.g., dynamic model discovery failed, using defaults).
   - `ERROR`: Network failures, HTTP error responses, or aborted streams.

## Log Format Example

```json
{
  "timestamp": "2026-11-19T13:40:00.123Z",
  "level": "INFO",
  "message": "Initiating OpenAI chat completion",
  "context": {
    "model": "gpt-4o",
    "provider": "openai"
  }
}
```

## Logging Events Covered

- Application and adapter initialization
- Connection verification attempts (`/api/test-connection`)
- Dynamic model discovery requests (`/api/models`)
- Streaming chat generation started and completed (`/api/chat`)
- Upstream HTTP errors and exception handling
