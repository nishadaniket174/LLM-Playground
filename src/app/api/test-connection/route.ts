import { NextRequest, NextResponse } from 'next/server';
import { getProviderAdapter } from '@/lib/adapters';
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
      return NextResponse.json(
        { success: false, message: 'Provider parameter is required' },
        { status: 400 }
      );
    }

    if (provider !== 'openai-compatible' && !apiKey) {
      return NextResponse.json(
        { success: false, message: 'API key is required for this provider' },
        { status: 400 }
      );
    }

    const adapter = getProviderAdapter(provider);
    const result = await adapter.validateCredentials(apiKey || '', customEndpoint);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    logger.error('Failed to validate connection', { error: message });
    return NextResponse.json(
      { success: false, message, error: message },
      { status: 500 }
    );
  }
}
