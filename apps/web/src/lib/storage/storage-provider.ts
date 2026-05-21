export type FileScopeType = "platform" | "project" | "event" | "guest";

export type RegisterFileInput = {
  bucket: string;
  category: string;
  createdByUserId?: string;
  scopeId?: string;
  scopeType: FileScopeType;
  storagePath: string;
};

export type RegisteredFile = RegisterFileInput & {
  id: string;
  version: number;
};

export type FileStorageAdapter = {
  getSignedReadUrl(path: string): Promise<string>;
  registerFile(input: RegisterFileInput): Promise<RegisteredFile>;
};

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("File storage is not configured for this environment.");
  }
}

export function createStorageAdapter(): FileStorageAdapter {
  return {
    async getSignedReadUrl() {
      throw new StorageNotConfiguredError();
    },
    async registerFile() {
      throw new StorageNotConfiguredError();
    },
  };
}

export function getStorageFoundationSummary() {
  return {
    accessControlled: true,
    provider: "supabase",
    requirementIds: ["FILE-001", "TECH-004"],
    status: "placeholder",
  };
}
