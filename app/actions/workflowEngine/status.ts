"use server";

import {
  createStatusRequest,
  listStatusesRequest,
  type CreateStatusPayload,
} from "@/lib/api/workflowEngine/status";
import type { Pagination, Status } from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function createStatusAction(
  projectId: string,
  payload: CreateStatusPayload,
): Promise<ActionResult<Status>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await createStatusRequest(projectId, payload, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function listStatusesAction(
  projectId: string,
): Promise<ActionResult<Pagination<Status>>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await listStatusesRequest(projectId, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
