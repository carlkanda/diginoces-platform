"use server";

import { redirect } from "next/navigation";
import {
  buildLoginRedirectPath,
  getAuthContext,
} from "@/lib/auth/auth-service";
import {
  ProjectAccessError,
  requireGlobalPermission,
} from "@/lib/projects/project-api";
import {
  createProject,
  parseCreateProjectFormPayload,
  ProjectValidationError,
} from "@/lib/projects/project-service";

function formObject(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).filter(
      ([, value]) => typeof value === "string",
    ),
  );
}

function projectsPath(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `/platform/projects?${searchParams.toString()}`;
}

export async function createProjectAction(formData: FormData) {
  const authContext = await getAuthContext();

  if (authContext.status === "anonymous") {
    redirect(buildLoginRedirectPath("/platform/projects"));
  }

  if (authContext.status === "not_configured") {
    redirect(projectsPath({ projectError: "supabase_not_configured" }));
  }

  const context = {
    supabase: authContext.supabase,
    user: authContext.user,
  };
  let projectId: string;

  try {
    await requireGlobalPermission(context, "projects.create");
    const input = parseCreateProjectFormPayload(formObject(formData));
    const project = await createProject(
      context.supabase,
      input,
      context.user.id,
    );

    projectId = project.id;
  } catch (error) {
    if (error instanceof ProjectAccessError) {
      redirect(projectsPath({ projectError: "permission_denied" }));
    }

    if (error instanceof ProjectValidationError) {
      redirect(projectsPath({ projectError: "invalid_project_request" }));
    }

    redirect(projectsPath({ projectError: "project_create_failed" }));
  }

  redirect(`/platform/projects/${projectId}`);
}
