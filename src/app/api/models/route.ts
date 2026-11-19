import { NextRequest, NextResponse } from 'next/server';
import { getProviderAdapter, PROVIDERS_METADATA } from '@/lib/adapters';
import { ProviderId } from '@/types';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, customEndpoint } = body as {
      provider: ProviderId;
      apiKey?: string;
      customEndpoint?: string;
    };

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const metadata = PROVIDERS_METADATA.find(p => p.id === provider);
    if (!metadata) {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    // If no key provided, return default known models for this provider
    if (!apiKey && provider !== 'openai-compatible') {
      return NextResponse.json({ models: metadata.defaultModels, source: 'default' });
    }

    const adapter = getProviderAdapter(provider);
    const models = await adapter.listModels(apiKey || '', customEndpoint);

    return NextResponse.json({ models, source: 'live' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models';
    logger.error('Error in /api/models', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
