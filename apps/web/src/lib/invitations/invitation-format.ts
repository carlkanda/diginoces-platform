import { isInternalProjectDisplayText } from "@/lib/projects/project-foundation";

export function formatTemplateName(name: string, index?: number) {
  if (isInternalProjectDisplayText(name) || /\bqa invitation\b/i.test(name)) {
    return typeof index === "number"
      ? `Invitation design ${index + 1}`
      : "Invitation design";
  }

  return name;
}

export function isInternalTemplateFileReference(value: string) {
  return (
    isInternalProjectDisplayText(value) ||
    /\b(mvp|qa|seed|demo)[-_/]/i.test(value)
  );
}

export function formatTemplateSourceFilename(filename: string, index?: number) {
  if (isInternalTemplateFileReference(filename)) {
    return typeof index === "number"
      ? `Canva PDF export ${index + 1}.pdf`
      : "Canva PDF export.pdf";
  }

  return filename;
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "Size not recorded";
  }

  const units = ["bytes", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const formatted =
    unitIndex === 0 ? Math.round(value).toString() : value.toFixed(1);

  return `${formatted} ${units[unitIndex]}`;
}
