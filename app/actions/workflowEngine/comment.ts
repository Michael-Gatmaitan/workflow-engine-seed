"use server";

import {
  createWorkItemCommentRequest,
  listWorkItemCommentsRequest,
  type CreateWorkItemCommentPayload,
} from "@/lib/api/workflowEngine/comment";
import type {
  Pagination,
  WorkItemComment,
} from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function createWorkItemCommentAction(
  projectId: string,
  itemId: string,
  payload: CreateWorkItemCommentPayload,
): Promise<ActionResult<WorkItemComment>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await createWorkItemCommentRequest(
      projectId,
      itemId,
      payload,
      auth,
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function listWorkItemCommentsAction(
  projectId: string,
  itemId: string,
): Promise<ActionResult<Pagination<WorkItemComment>>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await listWorkItemCommentsRequest(projectId, itemId, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
