"use server";

import {
  createWorkflowRequest,
  listWorkflowsRequest,
  type CreateWorkflowPayload,
  type ListWorkflowsParams,
} from "@/lib/api/workflowEngine/workflow";
import type { Pagination, Workflow } from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function createWorkflowAction(
  projectId: string,
  payload: CreateWorkflowPayload,
): Promise<ActionResult<Workflow>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await createWorkflowRequest(projectId, payload, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function listWorkflowsAction(
  projectId: string,
  params: ListWorkflowsParams = {},
): Promise<ActionResult<Pagination<Workflow>>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await listWorkflowsRequest(projectId, params, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
