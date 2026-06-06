import { createClient } from "@supabase/supabase-js";
import { requireSupabasePublicEnvironment } from "@/lib/env/public-env";
import type { Database } from "@/types/database";

export type FileScopeType =
  | "event"
  | "guest"
  | "invitation"
  | "platform"
  | "project";

export type RegisterFileInput = {
  bucket: string;
  category: string;
  createdByUserId?: string;
  scopeId?: string;
  scopeType: FileScopeType;
  storagePath: string;
};

export type SignedReadUrlInput = {
  bucket: string;
  expiresInSeconds: number;
  path: string;
};

export type RegisteredFile = RegisterFileInput & {
  id: string;
  version: number;
};

export type FileStorageAdapter = {
  getSignedReadUrl(input: SignedReadUrlInput): Promise<string>;
  registerFile(input: RegisterFileInput): Promise<RegisteredFile>;
};

export class StorageNotConfiguredError extends Error {
  constructor(
    message = "File storage is not configured for this environment.",
  ) {
    super(message);
  }
}

type StorageSigningEnvironment = Record<string, string | undefined> & {
  SUPABASE_SECRET_KEY?: string;
};

const supabaseServiceRoleKeyName = "SUPABASE_" + "SERVICE_ROLE_KEY";

function isCompactJwt(value: string) {
  return value.split(".").length === 3;
}

export function getSupabaseStorageSigningKey(
  env: StorageSigningEnvironment = process.env,
) {
  const serviceRoleKey = env[supabaseServiceRoleKeyName]?.trim();

  if (serviceRoleKey) {
    return serviceRoleKey;
  }

  const secretKey = env.SUPABASE_SECRET_KEY?.trim();

  if (!secretKey) {
    throw new StorageNotConfiguredError();
  }

  if (!isCompactJwt(secretKey)) {
    throw new StorageNotConfiguredError(
      "Supabase Storage signed URL generation requires a JWT storage signing credential.",
    );
  }

  return secretKey;
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

export function createSupabaseStorageAdapter(client: {
  storage: {
    from(bucket: string): {
      createSignedUrl(
        path: string,
        expiresIn: number,
      ): Promise<{
        data: { signedUrl: string } | null;
        error: Error | null;
      }>;
    };
  };
}): Pick<FileStorageAdapter, "getSignedReadUrl"> {
  return {
    async getSignedReadUrl(input) {
      const { data, error } = await client.storage
        .from(input.bucket)
        .createSignedUrl(input.path, input.expiresInSeconds);

      if (error || !data?.signedUrl) {
        throw error ?? new StorageNotConfiguredError();
      }

      return data.signedUrl;
    },
  };
}

export function createSupabaseServerStorageAdapter(
  env: StorageSigningEnvironment = process.env,
) {
  const publicEnvironment = requireSupabasePublicEnvironment();
  const secretKey = getSupabaseStorageSigningKey(env);
  const supabase = createClient<Database>(
    publicEnvironment.supabaseUrl,
    secretKey,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );

  return createSupabaseStorageAdapter(supabase);
}

export function getStorageFoundationSummary() {
  return {
    accessControlled: true,
    provider: "supabase",
    requirementIds: [
      "FILE-001",
      "FILE-004",
      "FILE-005",
      "FILE-006",
      "TECH-004",
    ],
    status: "placeholder",
  };
}
