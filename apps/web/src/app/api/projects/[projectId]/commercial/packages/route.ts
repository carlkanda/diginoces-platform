import type { NextRequest } from "next/server";
import { readJson } from "@/lib/api/read-json";
import {
  handleCommercialApiError,
  requirePackageManagePermission,
  requirePackageReadPermission,
} from "@/lib/contracts/contract-api";
import {
  createServicePackage,
  createServicePackageAddon,
  listServicePackageAddons,
  listServicePackages,
} from "@/lib/contracts/contract-db";
import { CommercialValidationError } from "@/lib/contracts/contract-service";
import {
  getProjectApiContext,
  handleProjectApiError,
  isProjectApiContext,
} from "@/lib/projects/project-api";

export async function GET() {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    await requirePackageReadPermission(context);

    return Response.json({
      addons: await listServicePackageAddons(context.supabase),
      packages: await listServicePackages(context.supabase),
    });
  } catch (error) {
    return handleProjectApiError(error);
  }
}

export async function POST(request: NextRequest) {
  const context = await getProjectApiContext();

  if (!isProjectApiContext(context)) {
    return context;
  }

  try {
    await requirePackageManagePermission(context);

    const payload = await readJson(request);
    const kind = payload.kind;

    if (kind === "addon") {
      return Response.json(
        await createServicePackageAddon(
          context.supabase,
          payload,
          context.user.id,
        ),
        { status: 201 },
      );
    }

    if (kind === "package") {
      return Response.json(
        await createServicePackage(context.supabase, payload, context.user.id),
        { status: 201 },
      );
    }

    const receivedKind =
      typeof kind === "string" ? kind.slice(0, 32) : typeof kind;

    throw new CommercialValidationError(
      `Service catalog kind must be package or addon. Received: ${receivedKind}.`,
    );
  } catch (error) {
    try {
      return handleCommercialApiError(error);
    } catch (projectError) {
      return handleProjectApiError(projectError);
    }
  }
}
