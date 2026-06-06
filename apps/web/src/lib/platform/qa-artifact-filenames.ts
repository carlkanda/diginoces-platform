export type QaArtifactFilenameValidation = {
  error: string | null;
  parsed: Record<string, string>;
  valid: boolean;
};

const TIMESTAMP_PATTERN = /^\d{8}T\d{6}Z$/;

function splitExtension(filename: string) {
  const trimmed = filename.trim();
  const lastSlash = Math.max(
    trimmed.lastIndexOf("/"),
    trimmed.lastIndexOf("\\"),
  );
  const basename = trimmed.slice(lastSlash + 1);
  const dotIndex = basename.lastIndexOf(".");

  if (dotIndex <= 0 || dotIndex === basename.length - 1) {
    return {
      extension: "",
      stem: basename,
    };
  }

  return {
    extension: basename.slice(dotIndex + 1),
    stem: basename.slice(0, dotIndex),
  };
}

export function sanitizeTesterId(testerId: string) {
  return testerId
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/__/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function validateArtifactFilename(
  filename: string,
): QaArtifactFilenameValidation {
  const { extension, stem } = splitExtension(filename);
  const segments = stem.split("__");
  const parsed: Record<string, string> = {};

  if (segments.length < 3) {
    return {
      error: "missing segments",
      parsed,
      valid: false,
    };
  }

  const [timestamp, ...keyValueSegments] = segments;
  parsed.timestamp = timestamp;

  if (!TIMESTAMP_PATTERN.test(timestamp)) {
    return {
      error: "invalid timestamp",
      parsed,
      valid: false,
    };
  }

  if (extension.length === 0) {
    return {
      error: "missing extension",
      parsed,
      valid: false,
    };
  }

  parsed.extension = extension;

  for (const segment of keyValueSegments) {
    const equalsIndex = segment.indexOf("=");

    if (equalsIndex <= 0) {
      return {
        error: "missing key/value",
        parsed,
        valid: false,
      };
    }

    const key = segment.slice(0, equalsIndex);
    const value = segment.slice(equalsIndex + 1);

    if (value.length === 0) {
      return {
        error: "missing value",
        parsed,
        valid: false,
      };
    }

    parsed[key] = value;
  }

  if (!parsed.tester || !parsed.scenario) {
    return {
      error: "missing required keys",
      parsed,
      valid: false,
    };
  }

  return {
    error: null,
    parsed,
    valid: true,
  };
}
