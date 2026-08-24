"use server";

import {
  attachTagRequest,
  listTagsForResourceRequest,
  type AttachTagPayload,
  type Tagging,
} from "@/lib/api/workflowEngine/tag";
import type { Tag } from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function attachTagAction(
  payload: AttachTagPayload,
): Promise<ActionResult<Tag>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await attachTagRequest(payload, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function listTagsForResourceAction(
  resourceId: string,
): Promise<ActionResult<Tagging[]>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await listTagsForResourceRequest(
      "WORK_ITEM",
      resourceId,
      auth,
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
