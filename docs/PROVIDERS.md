# Supported Providers & Capabilities

This application supports multiple AI providers using a modular adapter architecture.

## Supported Providers

| Provider | ID | Default Base URL | Authentication | Supported Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **OpenAI** | `openai` | `https://api.openai.com/v1` | Bearer Token (`sk-...`) | Temperature, Top P, Max Tokens, Frequency Penalty, Presence Penalty, Seed, Stop Sequences, Streaming |
| **Google Gemini** | `gemini` | `https://generativelanguage.googleapis.com/v1beta` | Query Key (`AIza...`) | Temperature, Top P, Top K, Max Output Tokens, Stop Sequences, Streaming |
| **Groq** | `groq` | `https://api.groq.com/openai/v1` | Bearer Token (`gsk_...`) | Temperature, Top P, Max Tokens, Frequency Penalty, Presence Penalty, Seed, Stop Sequences, Streaming |
| **Anthropic** | `anthropic` | `https://api.anthropic.com/v1` | `x-api-key` (`sk-ant-...`) | Temperature, Top P, Top K, Max Output Tokens, Stop Sequences, Streaming |
| **OpenAI Compatible** | `openai-compatible` | User Configurable (e.g. `https://api.together.xyz/v1`) | Bearer Token (optional) | Temperature, Top P, Top K, Max Tokens, Frequency Penalty, Presence Penalty, Seed, Stop Sequences, Streaming |

---

## Capabilities Matrix

| Capability | OpenAI | Gemini | Groq | Anthropic | OpenAI-Compatible |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Streaming | Yes | Yes | Yes | Yes | Yes |
| Top K | No | Yes | No | Yes | Yes |
| Top P | Yes | Yes | Yes | Yes | Yes |
| Temperature | Yes | Yes | Yes | Yes | Yes |
| Frequency Penalty | Yes | No | Yes | No | Yes |
| Presence Penalty | Yes | No | Yes | No | Yes |
| Seed (Deterministic) | Yes | No | Yes | No | Yes |
| Custom Base URL | No | No | No | No | Yes |
| Model Discovery | Yes | Yes | Yes | Yes | Yes |

---

## Context Window vs Output Limits

- **Context Window** represents the combined token capacity (input prompt + history + output) supported by the model architecture.
- **Max Output Tokens** is the configurable ceiling for how many tokens the model will generate in a single response turn.
- Cloud APIs do not allow clients to dynamically extend a model's architectural context window beyond its pre-trained limit. The UI clearly displays the model's physical context limit while allowing adjustment of the generation output token limit.
