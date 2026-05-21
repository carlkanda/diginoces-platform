import type { Database } from "@/types/database";

export type EventType = Database["public"]["Enums"]["event_type"];

export const eventTypeCodeMap: Record<EventType, string> = {
  brunch: "BRU",
  civil: "CIV",
  customary: "TRD",
  other: "EVT",
  reception: "REC",
  religious: "REL",
};

export type ProjectCodeInput = {
  brideName: string;
  groomName: string;
  sequence?: number;
  year: number;
};

export type EventCodeInput = {
  eventType: EventType;
  projectCode: string;
  sequence?: number;
};

export function normalizeCodeSegment(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function getCoupleCode(brideName: string, groomName: string) {
  const normalized = normalizeCodeSegment(`${brideName}${groomName}`);
  return `${normalized}WED`.slice(0, 3);
}

function normalizeSequence(sequence: number | undefined) {
  const value = sequence ?? 1;

  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError("sequence must be a positive integer.");
  }

  return value;
}

export function formatProjectCode({
  brideName,
  groomName,
  sequence,
  year,
}: ProjectCodeInput) {
  const normalizedSequence = normalizeSequence(sequence);

  return `${getCoupleCode(brideName, groomName)}-${year}-${String(normalizedSequence).padStart(3, "0")}`;
}

export function formatEventCode({
  eventType,
  projectCode,
  sequence,
}: EventCodeInput) {
  const normalizedSequence = normalizeSequence(sequence);
  const baseCode = `${projectCode}-${eventTypeCodeMap[eventType]}`;

  if (normalizedSequence <= 1) {
    return baseCode;
  }

  return `${baseCode}-${String(normalizedSequence).padStart(2, "0")}`;
}
