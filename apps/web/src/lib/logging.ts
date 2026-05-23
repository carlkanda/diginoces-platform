type LogContext = Record<string, unknown>;

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

export const serverLogger = {
  error(message: string, context: LogContext = {}) {
    const { error, ...rest } = context;

    console.error(
      JSON.stringify({
        level: "error",
        message,
        ...rest,
        ...(error === undefined ? {} : { error: serializeUnknown(error) }),
      }),
    );
  },
};
