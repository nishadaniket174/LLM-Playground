type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  provider?: string;
  model?: string;
  requestId?: string;
  durationMs?: number;
  statusCode?: number;
  [key: string]: unknown;
}

/**
 * Sanitizes input objects or strings to prevent accidental leakage of sensitive keys,
 * authorization tokens, or private credentials in logs.
 */
function sanitize(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) {
    if (typeof data === 'string') {
      // Redact potential API key formats
      if (/sk-[a-zA-Z0-9_\-]{20,}/i.test(data)) {
        return '[REDACTED_API_KEY]';
      }
      if (/AIzaSy[a-zA-Z0-9_\-]{30,}/i.test(data)) {
        return '[REDACTED_GEMINI_KEY]';
      }
      if (/gsk_[a-zA-Z0-9_\-]{20,}/i.test(data)) {
        return '[REDACTED_GROQ_KEY]';
      }
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const sanitizedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('key') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('auth') ||
      lowerKey.includes('password')
    ) {
      sanitizedObj[key] = '[REDACTED]';
    } else {
      sanitizedObj[key] = sanitize(value);
    }
  }
  return sanitizedObj;
}

class AppLogger {
  private format(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const sanitizedContext = context ? sanitize(context) : undefined;
    const entry = {
      timestamp,
      level,
      message,
      ...(sanitizedContext ? { context: sanitizedContext } : {}),
    };
    return JSON.stringify(entry);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format('DEBUG', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.format('INFO', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.format('WARN', message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.format('ERROR', message, context));
  }
}

export const logger = new AppLogger();
