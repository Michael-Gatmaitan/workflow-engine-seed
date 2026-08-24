"use server";

import {
  createWorkItemTypeRequest,
  getWorkItemTypesRequest,
  type CreateWorkItemTypePayload,
} from "@/lib/api/workflowEngine/workItemType";
import type { Pagination, WorkItemType } from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function createWorkItemTypeAction(
  projectId: string,
  payload: CreateWorkItemTypePayload,
): Promise<ActionResult<WorkItemType>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await createWorkItemTypeRequest(projectId, payload, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function getWorkItemTypesAction(
  projectId: string,
): Promise<ActionResult<Pagination<WorkItemType>>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await getWorkItemTypesRequest(projectId, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
