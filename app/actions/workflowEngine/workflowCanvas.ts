"use server";

import {
  getWorkflowCanvasRequest,
  saveWorkflowCanvasRequest,
  type SaveWorkflowCanvasPayload,
} from "@/lib/api/workflowEngine/workflowCanvas";
import type { WorkflowCanvasResponse } from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function saveWorkflowCanvasAction(
  projectId: string,
  workflowId: string,
  payload: SaveWorkflowCanvasPayload,
): Promise<ActionResult<null>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await saveWorkflowCanvasRequest(
      projectId,
      workflowId,
      payload,
      auth,
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function getWorkflowCanvasAction(
  projectId: string,
  workflowId: string,
): Promise<ActionResult<WorkflowCanvasResponse>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await getWorkflowCanvasRequest(projectId, workflowId, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
