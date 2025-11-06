import * as Sentry from "@sentry/react-native";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isProduction: boolean;
  private sentryEnabled: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
    this.sentryEnabled = !!process.env.EXPO_PUBLIC_SENTRY_DSN;

    if (this.sentryEnabled && this.isProduction) {
      Sentry.init({
        dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
        enableAutoSessionTracking: true,
        environment: process.env.NODE_ENV,
        release: process.env.EXPO_PUBLIC_APP_VERSION,
      });
    }
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message} ${contextStr}`;
  }

  private captureException(error: Error, context?: LogContext) {
    if (this.sentryEnabled && this.isProduction) {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  }

  debug(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage("info", message, context));

    if (this.isProduction && context?.important) {
      // Log important info events in production for monitoring
      Sentry.addBreadcrumb({
        category: "info",
        message,
        data: context,
        level: "info",
      });
    }
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage("warn", message, context));

    if (this.isProduction) {
      Sentry.addBreadcrumb({
        category: "warning",
        message,
        data: context,
        level: "warning",
      });
    }
  }

  error(error: Error | string, context?: LogContext) {
    const errorObj = error instanceof Error ? error : new Error(error);
    const formattedMessage = this.formatMessage(
      "error",
      errorObj.message,
      context
    );

    console.error(formattedMessage);

    if (this.isProduction) {
      this.captureException(errorObj, context);
    }
  }

  // Performance monitoring
  startPerformanceTracking(name: string) {
    if (this.isProduction) {
      const transaction = Sentry.startTransaction({
        name,
        op: "transaction",
      });

      Sentry.configureScope((scope) => {
        scope.setSpan(transaction);
      });

      return transaction;
    }
    return null;
  }

  endPerformanceTracking(transaction: any) {
    if (transaction && this.isProduction) {
      transaction.finish();
    }
  }

  // Analytics events
  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (this.isProduction) {
      Sentry.addBreadcrumb({
        category: "analytics",
        message: eventName,
        data: properties,
        level: "info",
      });
    }
  }
}

export const logger = new Logger();
