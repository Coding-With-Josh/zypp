import { AppError, ErrorSeverity } from "@/types";
import Constants from "expo-constants";
import { secureStorageManager } from "../storage/secure-store";
import { supabase } from "../supabase/client";

// Create enum for log levels
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

// Interface for structured logging
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  category: string;
  details?: any;
  error?: AppError;
}

// Keep an in-memory cache of recent logs
const recentLogs: LogEntry[] = [];
const MAX_LOGS = 100;

// Get device info
const getDeviceInfo = () => {
  const deviceId = Constants.installationId;
  const appVersion = Constants.expoConfig?.version ?? "unknown";
  const platform = Constants.platform?.ios ? "ios" : "android";
  const osVersion = Constants.systemVersion ?? "unknown";

  return {
    deviceId,
    appVersion,
    platform,
    osVersion,
  };
};

export const logDebug = (message: string, category: string, details?: any) => {
  log(LogLevel.DEBUG, message, category, details);
};

export const logInfo = (message: string, category: string, details?: any) => {
  log(LogLevel.INFO, message, category, details);
};

export const logWarn = (message: string, category: string, details?: any) => {
  log(LogLevel.WARN, message, category, details);
};

export const logError = async (
  message: string,
  error: Error | unknown,
  severity: ErrorSeverity = "medium"
) => {
  const timestamp = new Date().toISOString();
  const deviceInfo = getDeviceInfo();

  const appError: AppError = {
    code: error instanceof Error ? error.name : "UNKNOWN_ERROR",
    message: error instanceof Error ? error.message : String(error),
    context: {
      originalMessage: message,
      stack: error instanceof Error ? error.stack : undefined,
    },
    timestamp,
    device_id: deviceInfo.deviceId,
  };

  // Add to logs with ERROR level
  log(LogLevel.ERROR, message, "error", { error: appError });

  // Store error in Supabase if we're authenticated
  try {
    const session = await secureStorageManager.getSession();
    if (session?.user_id) {
      await supabase.from("error_logs").insert([
        {
          user_id: session.user_id,
          device_id: deviceInfo.deviceId,
          error_code: appError.code,
          severity: severity,
          message: appError.message,
          context: appError.context,
          app_version: deviceInfo.appVersion,
          os_version: deviceInfo.osVersion,
          created_at: timestamp,
        },
      ]);
    }
  } catch (e) {
    console.error("Failed to store error log:", e);
  }

  return appError;
};

// Main logging function
const log = (
  level: LogLevel,
  message: string,
  category: string,
  details?: any
) => {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    category,
    details,
  };

  // Add to recent logs
  recentLogs.unshift(entry);
  if (recentLogs.length > MAX_LOGS) {
    recentLogs.pop();
  }

  // Console output with color coding
  const color = getColorForLevel(level);
  console.log(
    `%c[${entry.timestamp}] ${level} - ${category}: ${message}`,
    `color: ${color}; font-weight: bold;`
  );
  if (details) {
    console.log(details);
  }
};

// Get color for log level
const getColorForLevel = (level: LogLevel): string => {
  switch (level) {
    case LogLevel.DEBUG:
      return "#6c757d"; // gray
    case LogLevel.INFO:
      return "#0d6efd"; // blue
    case LogLevel.WARN:
      return "#ffc107"; // yellow
    case LogLevel.ERROR:
      return "#dc3545"; // red
    default:
      return "#000000";
  }
};

// Export function to get recent logs
export const getRecentLogs = () => [...recentLogs];

// Export function to clear logs
export const clearLogs = () => {
  recentLogs.length = 0;
};
