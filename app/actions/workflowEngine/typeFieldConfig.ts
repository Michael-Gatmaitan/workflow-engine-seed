"use server";

import {
  createTypeFieldConfigRequest,
  listTypeFieldConfigsRequest,
  type CreateTypeFieldConfigPayload,
} from "@/lib/api/workflowEngine/typeFieldConfig";
import type {
  Pagination,
  TypeFieldConfig,
} from "@/lib/api/workflowEngine/types";
import {
  getWorkflowEngineAuthContext,
  toActionErrorFields,
  type ActionResult,
} from "@/app/actions/workflowEngine/shared";

export async function createTypeFieldConfigAction(
  projectId: string,
  typeId: string,
  payload: CreateTypeFieldConfigPayload,
): Promise<ActionResult<TypeFieldConfig>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await createTypeFieldConfigRequest(
      projectId,
      typeId,
      payload,
      auth,
    );
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}

export async function listTypeFieldConfigsAction(
  projectId: string,
  typeId: string,
): Promise<ActionResult<Pagination<TypeFieldConfig>>> {
  const auth = await getWorkflowEngineAuthContext();
  if (!auth) {
    return { success: false, error: "You must be signed in to do this." };
  }

  try {
    const data = await listTypeFieldConfigsRequest(projectId, typeId, auth);
    return { success: true, data };
  } catch (error) {
    return { success: false, ...toActionErrorFields(error) };
  }
}
