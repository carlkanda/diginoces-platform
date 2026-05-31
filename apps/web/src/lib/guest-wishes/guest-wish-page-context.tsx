import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  ProjectAccessError,
  type ProjectApiContext,
} from "@/lib/projects/project-api";

type ResolveGuestWishProjectPageContextInput<TPermissions> = {
  nextPath: string;
  notConfiguredMessage: string;
  notConfiguredTitle: string;
  projectId: string;
  requirePermission: (
    context: ProjectApiContext,
    projectId: string,
  ) => Promise<TPermissions>;
};

export async function resolveGuestWishProjectPageContext<TPermissions>({
  nextPath,
  notConfiguredMessage,
  notConfiguredTitle,
  projectId,
  requirePermission,
}: ResolveGuestWishProjectPageContextInput<TPermissions>): Promise<
  | {
      element: ReactNode;
      status: "not_configured";
    }
  | {
      context: ProjectApiContext;
      permissions: TPermissions;
      status: "ok";
      supabase: ProjectApiContext["supabase"];
    }
> {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath(nextPath));
  }

  if (authContext.status === "not_configured") {
    return {
      element: (
        <>
          <h1 className="page-title">{notConfiguredTitle}</h1>
          <section className="section">
            <div className="alert">{notConfiguredMessage}</div>
          </section>
        </>
      ),
      status: "not_configured",
    };
  }

  const supabase = authContext.supabase;
  const context = { supabase, user: authContext.user };

  try {
    const permissions = await requirePermission(context, projectId);

    return {
      context,
      permissions,
      status: "ok",
      supabase,
    };
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      notFound();
    }

    throw error;
  }
}
