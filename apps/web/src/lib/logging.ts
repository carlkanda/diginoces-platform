type LogContext = Record<string, unknown>;

// reservedLogKeys filters context keys that would override core log payload
// fields; add new core fields here when they are introduced.
const reservedLogKeys = new Set(["error", "level", "message"]);

function serializeUnknown(value: unknown) {
  if (value instanceof Error) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
    };
  }

  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function serializeContext(context: LogContext) {
  return Object.fromEntries(
    Object.entries(context)
      .filter(([key]) => !reservedLogKeys.has(key))
      .map(([key, value]) => {
        if (value instanceof Error) {
          return [key, serializeUnknown(value)];
        }

        if (typeof value === "bigint") {
          return [key, value.toString()];
        }

        if (typeof value === "object" && value !== null) {
          return [key, serializeUnknown(value)];
        }

        return [key, value];
      }),
  );
}

export const serverLogger = {
  info(message: string, context: LogContext = {}) {
    const payload = {
      level: "info",
      message,
      ...serializeContext(context),
    };

    try {
      console.info(JSON.stringify(payload));
    } catch {
      console.info(
        JSON.stringify({
          level: "info",
          message: "Failed to serialize log payload.",
          originalMessage: message,
        }),
      );
    }
  },
  error(message: string, context: LogContext = {}) {
    const { error, ...rest } = context;
    const payload = {
      level: "error",
      message,
      ...serializeContext(rest),
      ...(error === undefined ? {} : { error: serializeUnknown(error) }),
    };

    try {
      console.error(JSON.stringify(payload));
    } catch {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Failed to serialize log payload.",
          originalMessage: message,
        }),
      );
    }
  },
};
