"use server";

import {
  createProjectRequest,
  deleteProjectRequest,
  listProjectsRequest,
  type CreateProjectPayload,
  type ListProjectsParams,
} from "@/lib/api/workflowEngine/project";
import type { Pagination, Project } from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function createProjectAction(
  payload: CreateProjectPayload,
): Promise<ActionResult<Project>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await createProjectRequest(payload, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function deleteProjectAction(
  projectId: string,
): Promise<ActionResult<void>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    await deleteProjectRequest(projectId, auth);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function listProjectsAction(
  params: ListProjectsParams,
): Promise<ActionResult<Pagination<Project>>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await listProjectsRequest(params, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
