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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h1 className="text-2xl font-semibold tracking-normal text-balance">
                  {notConfiguredTitle}
                </h1>
              </CardTitle>
              <CardDescription>
                Connect the workspace before loading protected celebration
                records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTitle>Workspace connection required</AlertTitle>
                <AlertDescription>{notConfiguredMessage}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
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
