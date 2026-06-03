import {
  FileValidationError,
  fileVisibilities,
  type FileVisibility,
} from "@/lib/files/file-service";

const allowedFileVisibilities = new Set<FileVisibility>(fileVisibilities);

export function formValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (value === null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new FileValidationError(`${key} must be a text value.`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function requiredFormValue(formData: FormData, key: string) {
  const value = formValue(formData, key);

  if (!value) {
    throw new FileValidationError(`${key} is required.`);
  }

  return value;
}

function parseFileVisibility(value: string | undefined): FileVisibility {
  const visibility = value ?? "internal";

  if (allowedFileVisibilities.has(visibility as FileVisibility)) {
    return visibility as FileVisibility;
  }

  throw new FileValidationError("File visibility is invalid.");
}

function parseFileSizeBytes(value: string) {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new FileValidationError(
      "fileSizeBytes must be a non-negative integer.",
    );
  }

  return parsed;
}

export function fileMetadataFromForm(formData: FormData) {
  const upload = formData.get("file");
  // Sprint 14 / FILE-001 / FILE-009 / Issue #30: file metadata is stored
  // before source-file persistence, so 0-byte placeholders are valid here.
  const file =
    upload instanceof File
      ? {
          fileSizeBytes: upload.size,
          filename: upload.name.trim() || undefined,
          mimeType: upload.type || undefined,
        }
      : null;

  return {
    category: requiredFormValue(formData, "category"),
    fileSizeBytes: file
      ? file.fileSizeBytes
      : parseFileSizeBytes(requiredFormValue(formData, "fileSizeBytes")),
    filename: file?.filename ?? requiredFormValue(formData, "filename"),
    mimeType: file?.mimeType ?? requiredFormValue(formData, "mimeType"),
    visibility: parseFileVisibility(formValue(formData, "visibility")),
  };
}
