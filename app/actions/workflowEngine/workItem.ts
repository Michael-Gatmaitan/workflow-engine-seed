"use server";

import {
  createWorkItemRequest,
  getWorkItemRequest,
  listWorkItemsRequest,
  updateWorkItemRequest,
  type CreateWorkItemPayload,
  type ListWorkItemsParams,
  type UpdateWorkItemPayload,
} from "@/lib/api/workflowEngine/workItem";
import type { Pagination, WorkItem } from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function createWorkItemAction(
  projectId: string,
  payload: CreateWorkItemPayload,
): Promise<ActionResult<WorkItem>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await createWorkItemRequest(projectId, payload, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function listWorkItemsAction(
  projectId: string,
  params: ListWorkItemsParams,
): Promise<ActionResult<Pagination<WorkItem>>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await listWorkItemsRequest(projectId, params, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function getWorkItemAction(
  projectId: string,
  itemId: string,
): Promise<ActionResult<WorkItem>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await getWorkItemRequest(projectId, itemId, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function updateWorkItemAction(
  projectId: string,
  itemId: string,
  payload: UpdateWorkItemPayload,
): Promise<ActionResult<WorkItem>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await updateWorkItemRequest(projectId, itemId, payload, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
