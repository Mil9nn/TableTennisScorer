/**
 * Error Logging Utility for React Native
 *
 * Provides centralized error logging
 * Use this instead of console.error for production error tracking
 */

type ErrorContext = {
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  extra?: Record<string, any>;
  tags?: Record<string, string>;
  level?: "fatal" | "error" | "warning" | "info" | "debug";
};

/**
 * Log an error to console and optionally to error tracking service
 *
 * @param error - The error object or message
 * @param context - Additional context (user, tags, extra data)
 *
 * @example
 * ```typescript
 * try {
 *   await processMatch(matchId);
 * } catch (error) {
 *   logError(error, {
 *     user: { id: userId, email: userEmail },
 *     tags: { feature: 'match-scoring' },
 *     extra: { matchId, tournamentId }
 *   });
 * }
 * ```
 */
export function logError(error: Error | string | unknown, context?: ErrorContext): void {
  // Always log to console for local debugging
  console.error("[Error]", error, context);

  // TODO: Integrate with error tracking service (e.g., Sentry for React Native)
  // if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureException(error, {
  //     level: context?.level || "error",
  //     tags: context?.tags,
  //     extra: context?.extra,
  //     user: context?.user,
  //   });
  // }
}

/**
 * Log a warning to console and optionally to error tracking service
 *
 * @param message - Warning message
 * @param context - Additional context
 */
export function logWarning(message: string, context?: ErrorContext): void {
  console.warn("[Warning]", message, context);

  // TODO: Integrate with error tracking service
  // if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureMessage(message, {
  //     level: "warning",
  //     tags: context?.tags,
  //     extra: context?.extra,
  //     user: context?.user,
  //   });
  // }
}

/**
 * Log an info message (useful for important events)
 *
 * @param message - Info message
 * @param context - Additional context
 */
export function logInfo(message: string, context?: ErrorContext): void {
  console.info("[Info]", message, context);

  // TODO: Integrate with error tracking service
  // if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  //   Sentry.captureMessage(message, {
  //     level: "info",
  //     tags: context?.tags,
  //     extra: context?.extra,
  //     user: context?.user,
  //   });
  // }
}

/**
 * Wrap an async function with error logging
 * Automatically logs any errors that occur
 *
 * @example
 * ```typescript
 * const processMatch = withErrorLogging(
 *   async (matchId: string) => {
 *     // Your code here
 *   },
 *   { tags: { feature: 'match-processing' } }
 * );
 * ```
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error; // Re-throw to allow caller to handle
    }
  }) as T;
}

