import { NextRequest } from 'next/server';
import { getProviderAdapter } from '@/lib/adapters';
import { ChatCompletionRequest } from '@/types';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body: ChatCompletionRequest = await req.json();

    const { provider, apiKey, model, messages, params } = body;

    if (!provider || !model || !messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (provider !== 'openai-compatible' && !apiKey) {
      return new Response(JSON.stringify({ error: 'API key is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const adapter = getProviderAdapter(provider);
    logger.info('Handling chat completion request', { provider, model, messageCount: messages.length });

    const stream = await adapter.createChatStream(
      {
        provider,
        apiKey: apiKey || '',
        customEndpoint: body.customEndpoint,
        model,
        systemPrompt: body.systemPrompt,
        messages,
        params: params || {
          temperature: 0.7,
          topP: 1.0,
          maxTokens: 2048,
          frequencyPenalty: 0,
          presencePenalty: 0,
          stopSequences: [],
          stream: true,
        },
      },
      req.signal
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat completion failed';
    logger.error('Error in /api/chat', { error: message });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
